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

class SpeechService {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private currentSource: string | null = null;
  private inferenceWorker: Worker | null = null;
  private pendingGenerations = new Map<number, PendingGeneration>();
  private generationQueue: Promise<void> = Promise.resolve();
  private requestId = 0;
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
  }) {
    this.stopSpeaking();

    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '').trim();
    if (!cleanText) {
      this.reportSpeechUnavailable('لا يوجد نص إنجليزي صالح للنطق.', onError);
      return;
    }

    if (ARABIC_SCRIPT.test(cleanText)) {
      this.reportSpeechUnavailable(
        'النطق متاح للنص الإنجليزي فقط؛ ستبقى الترجمة العربية مكتوبة على الشاشة.',
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
    this.setStatus('loading');

    const task = this.generationQueue.then(async () => {
      if (requestId !== this.requestId) return;

      try {
        const voice = this.getVoice(accent, gender);
        const audioBlob = await this.generateInWorker({
          requestId,
          text: cleanText,
          voice,
          speed: Math.max(0.5, Math.min(1.2, rate)),
        }, (progress) => {
          if (requestId === this.requestId) this.setStatus('loading', progress);
        });
        if (requestId !== this.requestId) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
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
      } catch (error) {
        if (requestId !== this.requestId) return;
        const message =
          typeof navigator !== 'undefined' && !navigator.onLine
            ? 'تعذر تحميل نموذج Kokoro دون اتصال. تنزيل النموذج يحتاج الإنترنت أول مرة؛ أعد المحاولة بعد الاتصال، ثم يمكن استخدام الملفات المحفوظة إذا بقيت في ذاكرة المتصفح.'
            : 'تعذر تحميل نموذج Kokoro أو توليد الصوت. تحقق من اتصال الإنترنت ومساحة التخزين وتوافق جهازك، ثم حاول مجددًا.';
        console.error('[speechService] Kokoro failed:', error);
        this.finishWithError(message, onError);
      }
    });

    this.generationQueue = task.catch(() => undefined);
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
