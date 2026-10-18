/** Local Kokoro English speech playback and synthesized UI sound effects. */

export const SPEECH_UNAVAILABLE_EVENT = 'englishtok:speech-unavailable';
export const SPEECH_STATUS_EVENT = 'englishtok:speech-status';

interface SpeechUnavailableDetail {
  message: string;
}

interface SpeechStatusDetail {
  status: 'loading' | 'playing' | 'idle';
  progress?: number;
}

const ARABIC_SCRIPT = /\p{Script=Arabic}/u;

interface GenerateRequest {
  requestId: number;
  text: string;
  voice: 'af_heart' | 'am_michael' | 'bf_emma' | 'bm_george';
  speed: number;
}

type GenerateResponse =
  | { requestId: number; type: 'progress'; progress: number }
  | { requestId: number; type: 'audio'; buffer: ArrayBuffer; mimeType: string }
  | { requestId: number; type: 'error'; message: string };

interface PendingGeneration {
  resolve: (audio: Blob) => void;
  reject: (error: Error) => void;
  onProgress: (progress: number) => void;
}

interface SpeechOptions {
  text: string;
  rate?: number;
  gender?: 'male' | 'female';
  accent?: string;
  audioAssetUrl?: string;
}

interface CachedAudioRecord {
  key: string;
  audio: Blob;
  lastUsedAt: number;
}

class SpeechService {
  private static readonly MAX_CACHED_AUDIO_ITEMS = 4;
  private static readonly MAX_CACHED_AUDIO_BYTES = 8 * 1024 * 1024;
  private static readonly MAX_PERSISTENT_AUDIO_ITEMS = 12;
  private static readonly MAX_PERSISTENT_AUDIO_BYTES = 16 * 1024 * 1024;
  private static readonly AUDIO_DATABASE_NAME = 'englishtok-speech-cache';
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private currentSource: string | null = null;
  private inferenceWorker: Worker | null = null;
  private pendingGenerations = new Map<number, PendingGeneration>();
  private generationQueue: Promise<void> = Promise.resolve();
  private requestId = 0;
  private generationRequestId = 0;
  private generatedAudio = new Map<string, Blob>();
  private generatedAudioBytes = 0;
  private inFlightAudio = new Map<string, Promise<Blob>>();
  private audioDatabasePromise: Promise<IDBDatabase | null> | null = null;
  private lastUnavailableMessage: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.stopSpeaking());
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.stopSpeaking();
  };

  private reportSpeechUnavailable(
    message: string,
    onError?: (error: unknown) => void
  ) {
    this.lastUnavailableMessage = message;
    this.setStatus('idle');
    const error = new Error(message);
    console.warn('[speechService]', error);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<SpeechUnavailableDetail>(SPEECH_UNAVAILABLE_EVENT, {
          detail: { message },
        })
      );
    }
    onError?.(error);
  }

  private setStatus(status: SpeechStatusDetail['status'], progress?: number) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<SpeechStatusDetail>(SPEECH_STATUS_EVENT, {
          detail: { status, progress },
        })
      );
    }
  }

  public getLastUnavailableMessage() {
    return this.lastUnavailableMessage;
  }

  public getLessonSpeechAssetUrl(
    lessonId: string,
    lineId: string,
    gender: 'male' | 'female',
    accent: string
  ) {
    const assetAccent = accent === 'en-GB' ? 'en-GB' : 'en-US';
    const voice = this.getVoice(assetAccent, gender);
    const voiceAccent = voice === 'bf_emma' || voice === 'bm_george' ? 'en-GB' : 'en-US';
    return `/audio/lessons/${encodeURIComponent(lessonId)}/${encodeURIComponent(lineId)}/${voiceAccent}.wav`;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public stopSpeaking = (source?: string) => {
    if (source && this.currentSource !== source) return;
    this.requestId += 1;
    this.currentSource = null;
    this.clearPlayback();
    this.setStatus('idle');
  };

  private clearPlayback() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) URL.revokeObjectURL(this.currentAudioUrl);
    this.currentAudioUrl = null;
  }

  private createInferenceWorker(): Worker {
    if (this.inferenceWorker) return this.inferenceWorker;

    const worker = new Worker(new URL('./speechWorker.ts', import.meta.url), {
      type: 'module',
      name: 'englishtok-kokoro',
    });
    worker.onmessage = ({ data }: MessageEvent<GenerateResponse>) => {
      const pending = this.pendingGenerations.get(data.requestId);
      if (!pending) return;

      if (data.type === 'progress') {
        pending.onProgress(data.progress);
      } else {
        this.pendingGenerations.delete(data.requestId);
        if (data.type === 'audio') {
          pending.resolve(new Blob([data.buffer], { type: data.mimeType }));
        } else {
          pending.reject(new Error(data.message));
        }
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.failPendingGenerations(new Error(event.message || 'Kokoro worker failed.'));
    };
    worker.onmessageerror = () => {
      this.failPendingGenerations(new Error('Kokoro worker returned an unreadable response.'));
    };

    this.inferenceWorker = worker;
    return worker;
  }

  private failPendingGenerations(error: Error) {
    this.inferenceWorker?.terminate();
    this.inferenceWorker = null;
    this.pendingGenerations.forEach(({ reject }) => reject(error));
    this.pendingGenerations.clear();
  }

  private generateInWorker(
    request: GenerateRequest,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.pendingGenerations.set(request.requestId, {
        resolve,
        reject,
        onProgress,
      });

      try {
        this.createInferenceWorker().postMessage(request);
      } catch (error) {
        this.pendingGenerations.delete(request.requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private getAudioKey(text: string, voice: GenerateRequest['voice'], speed: number) {
    return `${voice}|${speed}|${text}`;
  }

  private getCachedAudio(key: string): Blob | undefined {
    const cached = this.generatedAudio.get(key);
    if (!cached) return undefined;
    this.generatedAudio.delete(key);
    this.generatedAudio.set(key, cached);
    return cached;
  }

  private cacheAudio(key: string, audio: Blob) {
    const previous = this.generatedAudio.get(key);
    if (previous) this.generatedAudioBytes -= previous.size;
    this.generatedAudio.delete(key);
    this.generatedAudio.set(key, audio);
    this.generatedAudioBytes += audio.size;

    while (
      this.generatedAudio.size > SpeechService.MAX_CACHED_AUDIO_ITEMS ||
      this.generatedAudioBytes > SpeechService.MAX_CACHED_AUDIO_BYTES
    ) {
      const oldestKey = this.generatedAudio.keys().next().value;
      if (oldestKey === undefined) break;
      const oldestAudio = this.generatedAudio.get(oldestKey);
      if (oldestAudio) this.generatedAudioBytes -= oldestAudio.size;
      this.generatedAudio.delete(oldestKey);
    }
  }

  private openAudioDatabase(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (this.audioDatabasePromise) return this.audioDatabasePromise;

    this.audioDatabasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(SpeechService.AUDIO_DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('audio')) {
          const store = database.createObjectStore('audio', { keyPath: 'key' });
          store.createIndex('lastUsedAt', 'lastUsedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.audioDatabasePromise = null;
        reject(request.error || new Error('Unable to open the speech audio cache.'));
      };
      request.onblocked = () => {
        this.audioDatabasePromise = null;
        reject(new Error('The speech audio cache upgrade is blocked by another tab.'));
      };
    });

    return this.audioDatabasePromise;
  }

  private async readPersistentAudio(key: string): Promise<Blob | undefined> {
    const database = await this.openAudioDatabase();
    if (!database) return undefined;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction('audio', 'readwrite');
      const store = transaction.objectStore('audio');
      const request = store.get(key) as IDBRequest<CachedAudioRecord | undefined>;
      let result: Blob | undefined;
      request.onsuccess = () => {
        const record = request.result;
        if (!record) return;
        result = record.audio;
        store.put({ ...record, lastUsedAt: Date.now() } satisfies CachedAudioRecord);
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () =>
        reject(transaction.error || new Error('Unable to read cached speech audio.'));
      transaction.onabort = () =>
        reject(transaction.error || new Error('Reading cached speech audio was aborted.'));
    });
  }

  private async writePersistentAudio(key: string, audio: Blob): Promise<void> {
    const database = await this.openAudioDatabase();
    if (!database) return;

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('audio', 'readwrite');
      const store = transaction.objectStore('audio');
      store.put({ key, audio, lastUsedAt: Date.now() } satisfies CachedAudioRecord);
      const request = store.getAll() as IDBRequest<CachedAudioRecord[]>;
      request.onsuccess = () => {
        const records = request.result.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
        let totalBytes = records.reduce((total, record) => total + record.audio.size, 0);
        let itemCount = records.length;
        for (const record of records) {
          if (
            itemCount <= SpeechService.MAX_PERSISTENT_AUDIO_ITEMS &&
            totalBytes <= SpeechService.MAX_PERSISTENT_AUDIO_BYTES
          ) {
            break;
          }
          store.delete(record.key);
          itemCount -= 1;
          totalBytes -= record.audio.size;
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error || new Error('Unable to persist generated speech audio.'));
      transaction.onabort = () =>
        reject(transaction.error || new Error('Persisting generated speech audio was aborted.'));
    });
  }

  private getOrGenerateAudio(
    text: string,
    voice: GenerateRequest['voice'],
    speed: number,
    onProgress: (progress: number) => void,
    audioAssetUrl?: string
  ): Promise<Blob> {
    const key = audioAssetUrl ? `asset:${audioAssetUrl}` : this.getAudioKey(text, voice, speed);
    const cached = this.getCachedAudio(key);
    if (cached) return Promise.resolve(cached);

    const existing = this.inFlightAudio.get(key);
    if (existing) return existing;

    const sharedGeneration = (async () => {
      let persisted: Blob | undefined;
      try {
        persisted = await this.readPersistentAudio(key);
      } catch (error) {
        console.warn('[speechService] Could not read persistent speech cache:', error);
      }
      if (persisted) {
        this.cacheAudio(key, persisted);
        return persisted;
      }

      if (audioAssetUrl) {
        try {
          const response = await fetch(audioAssetUrl, { cache: 'force-cache' });
          if (!response.ok) {
            throw new Error(`Pre-generated speech asset request failed (${response.status}).`);
          }
          const audio = await response.blob();
          if (!audio.type.startsWith('audio/')) {
            throw new Error(`Unexpected pre-generated speech asset type: ${audio.type || 'unknown'}.`);
          }
          this.cacheAudio(key, audio);
          try {
            await this.writePersistentAudio(key, audio);
          } catch (error) {
            console.warn('[speechService] Could not persist pre-generated speech audio:', error);
          }
          return audio;
        } catch (error) {
          console.warn(
            `[speechService] Could not load pre-generated speech asset "${audioAssetUrl}"; falling back to Kokoro.`,
            error
          );
        }
      }

      const generation = this.generationQueue.then(() => {
        const requestId = ++this.generationRequestId;
        return this.generateInWorker({ requestId, text, voice, speed }, onProgress);
      });
      this.generationQueue = generation.then(
        () => undefined,
        () => undefined
      );
      const audio = await generation;
      this.cacheAudio(key, audio);
      try {
        await this.writePersistentAudio(key, audio);
      } catch (error) {
        console.warn('[speechService] Could not persist generated speech audio:', error);
      }
      return audio;
    })().finally(() => this.inFlightAudio.delete(key));
    this.inFlightAudio.set(key, sharedGeneration);
    return sharedGeneration;
  }

  private normalizeSpeechText(text: string): string | null {
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '').trim();
    if (!cleanText || ARABIC_SCRIPT.test(cleanText)) return null;
    return cleanText;
  }

  public preloadText({
    text,
    rate = 1.0,
    gender = 'female',
    accent = 'en-US',
    audioAssetUrl,
  }: SpeechOptions) {
    const cleanText = this.normalizeSpeechText(text);
    if (!cleanText) return;

    const voice = this.getVoice(accent, gender);
    const speed = Math.max(0.5, Math.min(1.2, rate));
    const key = this.getAudioKey(cleanText, voice, speed);
    if (this.getCachedAudio(key) || this.inFlightAudio.has(key)) return;

    void this.getOrGenerateAudio(cleanText, voice, speed, () => undefined, audioAssetUrl).catch(
      (error: unknown) => {
        console.warn('[speechService] Speech preloading failed:', error);
      }
    );
  }

  public speakText({
    source,
    text,
    rate = 1.0,
    pitch = 1.0,
    gender = 'female',
    accent = 'en-US',
    onStart,
    onEnd,
    onError,
    audioAssetUrl,
  }: {
    source: string;
    text: string;
    rate?: number;
    pitch?: number;
    gender?: 'male' | 'female';
    accent?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
    audioAssetUrl?: string;
  }) {
    this.stopSpeaking();

    const cleanText = this.normalizeSpeechText(text);
    if (!cleanText) {
      this.reportSpeechUnavailable(
        'أدخل نصًا إنجليزيًا صالحًا للنطق؛ لا تُرسل الترجمة العربية إلى محرك الصوت.',
        onError
      );
      return;
    }

    if (typeof WebAssembly === 'undefined' || typeof Audio === 'undefined') {
      this.reportSpeechUnavailable(
        'جهازك أو متصفحك لا يدعم تشغيل Kokoro المحلي. جرّب متصفحًا حديثًا وجهازًا بذاكرة كافية.',
        onError
      );
      return;
    }

    if (
      typeof navigator !== 'undefined' &&
      'deviceMemory' in navigator &&
      typeof navigator.deviceMemory === 'number' &&
      navigator.deviceMemory < 2
    ) {
      this.reportSpeechUnavailable(
        'قد لا تتوفر ذاكرة كافية لتشغيل نموذج Kokoro على هذا الجهاز. جرّب جهازًا أحدث بذاكرة 2 غيغابايت أو أكثر.',
        onError
      );
      return;
    }

    this.lastUnavailableMessage = null;
    const requestId = this.requestId;
    this.currentSource = source;
    const voice = this.getVoice(accent, gender);
    const speed = Math.max(0.5, Math.min(1.2, rate));
    const audioKey = audioAssetUrl
      ? `asset:${audioAssetUrl}`
      : this.getAudioKey(cleanText, voice, speed);
    const cachedAudio = this.getCachedAudio(audioKey);
    if (!cachedAudio) this.setStatus('loading');

    void this.getOrGenerateAudio(cleanText, voice, speed, (progress) => {
      if (requestId === this.requestId) this.setStatus('loading', progress);
    }, audioAssetUrl)
      .then(async (audioBlob) => {
        if (requestId !== this.requestId) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = speed;
        audio.preservesPitch = true;
        this.currentAudioUrl = audioUrl;
        this.currentAudio = audio;
        audio.onplaying = () => {
          if (requestId !== this.requestId) return;
          this.setStatus('playing');
          onStart?.();
        };
        audio.onended = () => {
          if (requestId !== this.requestId) return;
          this.clearPlayback();
          this.currentSource = null;
          this.requestId += 1;
          this.setStatus('idle');
          onEnd?.();
        };
        audio.onerror = () => {
          if (requestId !== this.requestId) return;
          this.finishWithError(
            'تعذر تشغيل الصوت الناتج من Kokoro. تحقق من إعدادات الصوت وحاول مجددًا.',
            onError
          );
        };
        await audio.play();
      })
      .catch((error: unknown) => {
        if (requestId !== this.requestId) return;
        const message =
          typeof navigator !== 'undefined' && !navigator.onLine
            ? 'تعذر تحميل نموذج Kokoro دون اتصال. تنزيل النموذج يحتاج الإنترنت أول مرة؛ أعد المحاولة بعد الاتصال، ثم يمكن استخدام الملفات المحفوظة إذا بقيت في ذاكرة المتصفح.'
            : 'تعذر تحميل نموذج Kokoro أو توليد الصوت. تحقق من اتصال الإنترنت ومساحة التخزين وتوافق جهازك، ثم حاول مجددًا.';
        console.error('[speechService] Kokoro failed:', error);
        this.finishWithError(message, onError);
      });
  }

  private getVoice(
    accent: string,
    gender: 'male' | 'female'
  ): GenerateRequest['voice'] {
    if (accent === 'en-GB') {
      return gender === 'male' ? 'bm_george' : 'bf_emma';
    }
    return gender === 'male' ? 'am_michael' : 'af_heart';
  }

  private finishWithError(message: string, onError?: (error: unknown) => void) {
    this.clearPlayback();
    this.requestId += 1;
    this.currentSource = null;
    this.reportSpeechUnavailable(message, onError);
  }

  // --- Sound Effects using Web Audio API Synthesizer ---

  public playPop() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context restricted or not supported
    }
  }

  public playHeartSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio fallback
    }
  }

  public playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.3);
      });
    } catch {
      // Silent fallback
    }
  }

  public playErrorBuzz() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silent fallback
    }
  }
}

export const speechService = new SpeechService();
