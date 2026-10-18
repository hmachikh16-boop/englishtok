/** Local Kokoro English speech playback and synthesized UI sound effects. */

import type { KokoroTTS } from 'kokoro-js';

export const SPEECH_UNAVAILABLE_EVENT = 'englishtok:speech-unavailable';
export const SPEECH_STATUS_EVENT = 'englishtok:speech-status';

interface SpeechUnavailableDetail {
  message: string;
}

interface SpeechStatusDetail {
  status: 'loading' | 'playing' | 'idle';
  progress?: number;
}

const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const ARABIC_SCRIPT = /\p{Script=Arabic}/u;

class SpeechService {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private currentSource: string | null = null;
  private modelPromise: Promise<KokoroTTS> | null = null;
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

  private loadModel(
    onProgress: (progress: number) => void
  ): Promise<KokoroTTS> {
    if (this.modelPromise) return this.modelPromise;

    this.modelPromise = import('kokoro-js')
      .then(async ({ KokoroTTS }) => {
        return KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
          dtype: 'q8',
          device: 'wasm',
          progress_callback: (info) => {
            if (
              info.status === 'progress' &&
              info.file.endsWith('model_quantized.onnx') &&
              info.total > 0
            ) {
              onProgress(Math.min(100, Math.round((info.loaded / info.total) * 100)));
            }
          },
        });
      })
      .catch((error: unknown) => {
        this.modelPromise = null;
        throw error;
      });

    return this.modelPromise;
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
        const model = await this.loadModel((progress) => {
          if (requestId === this.requestId) this.setStatus('loading', progress);
        });
        if (requestId !== this.requestId) return;

        const voice = this.getVoice(accent, gender);
        const audioData = await model.generate(cleanText, {
          voice,
          speed: Math.max(0.5, Math.min(1.2, rate)),
        });
        if (requestId !== this.requestId) return;

        const audioUrl = URL.createObjectURL(audioData.toBlob());
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

  private getVoice(accent: string, gender: 'male' | 'female') {
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
