/** Studio English speech playback (bundled clips) plus synthesized UI sound effects. */

import {
  normalizeSpeechLanguage,
  normalizeSpeechText as normalizeClipText,
  resolveSpeechLanguage,
  speechClipUrl,
  type SpeechVoice,
} from './speechClip';

export const SPEECH_UNAVAILABLE_EVENT = 'englishtok:speech-unavailable';
export const SPEECH_STATUS_EVENT = 'englishtok:speech-status';

interface SpeechUnavailableDetail {
  message: string;
}

interface SpeechStatusDetail {
  status: 'loading' | 'playing' | 'idle';
  progress?: number;
}

interface SpeechOptions {
  text: string;
  rate?: number;
  gender?: 'male' | 'female';
  accent?: string;
  audioAssetUrl?: string;
}

interface PlaybackHandlers {
  requestId: number;
  source: string;
  text: string;
  rate: number;
  pitch: number;
  gender: 'male' | 'female';
  accent: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
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
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentSource: string | null = null;
  private requestId = 0;
  private generatedAudio = new Map<string, Blob>();
  private generatedAudioBytes = 0;
  private inFlightAudio = new Map<string, Promise<Blob>>();
  private audioDatabasePromise: Promise<IDBDatabase | null> | null = null;
  private lastUnavailableMessage: string | null = null;
  /** Clips this build does not ship, remembered so we never fetch them twice. */
  private missingAudioKeys = new Set<string>();

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

  /** URL of the bundled studio clip for a line, or undefined when there is none. */
  public getSpeechClipUrl(text: string, gender: 'male' | 'female', accent: string) {
    return speechClipUrl(text, gender, accent) ?? undefined;
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
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    this.setStatus('idle');
  };

  private clearPlayback() {
    if (this.currentAudio) {
      this.currentAudio.onplaying = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) URL.revokeObjectURL(this.currentAudioUrl);
    this.currentAudioUrl = null;
  }

  private playBrowserSpeech({
    requestId,
    source,
    text,
    rate,
    pitch,
    gender,
    accent,
    onStart,
    onEnd,
    onError,
    reason,
  }: PlaybackHandlers & { reason: unknown }) {
    if (requestId !== this.requestId) return;

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      this.finishWithError(
        'تعذر تشغيل الصوت المحلي على هذا الجهاز. تحقق من دعم النطق في المتصفح أو جرّب متصفحًا آخر.',
        onError
      );
      return;
    }

    console.info('[speechService] Speaking with the device voice for instant playback.', reason);
    this.clearPlayback();

    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const language = normalizeSpeechLanguage(accent) === 'fr' ? 'fr-FR' : 'en-US';
    const voices = synthesis
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
    const genderPattern =
      language === 'fr-FR'
        ? /female|woman|amélie|amelie|audrey|thomas/i
        : gender === 'female'
          ? /female|woman|samantha|zira|jenny|aria/i
          : /male|man|david|mark|george/i;
    utterance.voice = voices.find((voice) => genderPattern.test(voice.name)) ?? voices[0] ?? null;
    utterance.lang = language;
    utterance.rate = Math.max(0.5, Math.min(1.2, rate));
    utterance.pitch = Math.max(0.5, Math.min(2, pitch));
    this.currentSource = source;
    this.currentUtterance = utterance;
    // The device voice starts instantly, so there is no loading state to report.

    utterance.onstart = () => {
      if (requestId !== this.requestId) return;
      this.setStatus('playing');
      onStart?.();
    };
    utterance.onend = () => {
      if (requestId !== this.requestId) return;
      this.currentUtterance = null;
      this.currentSource = null;
      this.requestId += 1;
      this.setStatus('idle');
      onEnd?.();
    };
    utterance.onerror = (event) => {
      if (requestId !== this.requestId) return;
      this.currentUtterance = null;
      this.finishWithError(
        `تعذر تشغيل صوت Kokoro أو صوت الجهاز (${event.error}). تحقق من إعدادات الصوت وحاول مجددًا.`,
        onError
      );
    };

    try {
      synthesis.speak(utterance);
    } catch (error) {
      this.currentUtterance = null;
      this.finishWithError(
        'تعذر بدء النطق على هذا الجهاز. تحقق من إعدادات الصوت وحاول مجددًا.',
        onError
      );
      console.error('[speechService] Device speech fallback failed:', error);
    }
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


  private normalizeSpeechText(text: string): string | null {
    return normalizeClipText(text);
  }

  /** True when this browser exposes a usable speech synthesiser. */
  private canUseDeviceSpeech() {
    return (
      typeof window !== 'undefined' &&
      Boolean(window.speechSynthesis) &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    );
  }

  /** Fetch a bundled clip (memory, IndexedDB, then network) without touching Kokoro. */
  private loadRecordedAudio(
    audioAssetUrl: string,
    voice: SpeechVoice,
    speed: number,
    accent: string
  ): Promise<Blob> {
    const key = `asset:v3:${JSON.stringify([audioAssetUrl, accent, voice, speed])}`;
    if (this.missingAudioKeys.has(key)) {
      return Promise.reject(new Error(`No bundled clip for "${audioAssetUrl}".`));
    }
    const cached = this.getCachedAudio(key);
    if (cached) return Promise.resolve(cached);
    const existing = this.inFlightAudio.get(key);
    if (existing) return existing;

    const load = (async () => {
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

      const response = await fetch(audioAssetUrl, { cache: 'force-cache' });
      if (!response.ok) {
        this.missingAudioKeys.add(key);
        throw new Error(`Bundled speech clip request failed (${response.status}).`);
      }
      const audio = await response.blob();
      if (!audio.type.startsWith('audio/')) {
        this.missingAudioKeys.add(key);
        throw new Error(`Unexpected bundled speech clip type: ${audio.type || 'unknown'}.`);
      }
      this.cacheAudio(key, audio);
      try {
        await this.writePersistentAudio(key, audio);
      } catch (error) {
        console.warn('[speechService] Could not persist bundled speech audio:', error);
      }
      return audio;
    })().finally(() => this.inFlightAudio.delete(key));

    this.inFlightAudio.set(key, load);
    return load;
  }

  /** Play an in-memory clip and report back when it cannot be decoded. */
  private playAudioBlob(
    blob: Blob,
    handlers: PlaybackHandlers,
    onFailure: (reason: unknown) => void
  ) {
    const { requestId } = handlers;
    const audioUrl = URL.createObjectURL(blob);
    this.clearPlayback();
    this.currentAudioUrl = audioUrl;

    const audio = new Audio(audioUrl);
    audio.playbackRate = Math.max(0.5, Math.min(1.2, handlers.rate));
    audio.preservesPitch = true;
    this.currentAudio = audio;

    audio.onplaying = () => {
      if (requestId !== this.requestId) return;
      this.setStatus('playing');
      handlers.onStart?.();
    };
    audio.onended = () => {
      if (requestId !== this.requestId) return;
      this.clearPlayback();
      this.currentSource = null;
      this.requestId += 1;
      this.setStatus('idle');
      handlers.onEnd?.();
    };
    audio.onerror = () => {
      if (requestId !== this.requestId) return;
      onFailure(new Error('The speech audio file could not be played.'));
    };

    void audio.play().catch((error: unknown) => {
      if (requestId !== this.requestId) return;
      onFailure(error);
    });
  }

  /**
   * Instant path: play the bundled studio clip when the library has one, otherwise
   * hand straight over to the phone voice, which never needs a download.
   */
  private playFastPath(handlers: PlaybackHandlers, audioAssetUrl?: string) {
    const useDeviceVoice = (reason: unknown) => {
      if (handlers.requestId !== this.requestId) return;
      if (this.canUseDeviceSpeech()) {
        this.playBrowserSpeech({ ...handlers, reason });
        return;
      }
      this.finishWithError('لا يوجد صوت مضمّن لهذه الجملة، وصوت الجهاز غير متاح.', handlers.onError);
    };

    if (!audioAssetUrl) {
      useDeviceVoice(new Error('Instant playback with the device voice.'));
      return;
    }

    const voice = this.getVoice(handlers.accent, handlers.gender);
    const speed = Math.max(0.5, Math.min(1.2, handlers.rate));
    // Bundled clips load straight from the app, so no loading state is needed.
    void this.loadRecordedAudio(audioAssetUrl, voice, speed, handlers.accent)
      .then((blob) => {
        if (handlers.requestId !== this.requestId) return;
        this.playAudioBlob(blob, handlers, useDeviceVoice);
      })
      .catch((error: unknown) => {
        useDeviceVoice(error);
      });
  }


  public preloadText({
    text,
    rate = 1.0,
    gender = 'female',
    accent = 'en',
    audioAssetUrl,
  }: SpeechOptions) {
    const cleanText = this.normalizeSpeechText(text);
    if (!cleanText) return;
    const language = resolveSpeechLanguage(cleanText, accent);
    const voice = this.getVoice(language, gender);
    const speed = Math.max(0.5, Math.min(1.2, rate));
    const clipUrl = audioAssetUrl ?? this.getSpeechClipUrl(cleanText, gender, language);

    // Bundled clips are worth fetching ahead of time; the phone voice is already instant.
    if (clipUrl) {
      void this.loadRecordedAudio(clipUrl, voice, speed, language).catch(() => undefined);
    }
  }

  public speakText({
    source,
    text,
    rate = 1.0,
    pitch = 1.0,
    gender = 'female',
    accent = 'en',
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
        'أدخل نصًا إنجليزيًا أو فرنسيًا صالحًا للنطق؛ لا تُرسل الترجمة العربية إلى محرك الصوت.',
        onError
      );
      return;
    }

    const language = resolveSpeechLanguage(cleanText, accent);
    const handlers: PlaybackHandlers = {
      requestId: this.requestId,
      source,
      text: cleanText,
      rate,
      pitch,
      gender,
      accent: language,
      onStart,
      onEnd,
      onError,
    };

    const clipUrl = audioAssetUrl ?? this.getSpeechClipUrl(cleanText, gender, language);
    this.playFastPath(handlers, clipUrl);
  }

  private getVoice(accent: string, gender: 'male' | 'female'): SpeechVoice {
    // Kokoro has a single French voice; English has one per gender.
    if (normalizeSpeechLanguage(accent) === 'fr') return 'ff_siwis';
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
