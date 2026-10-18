/** EnglishTok speech playback and locally synthesized UI sound effects. */

export const SPEECH_UNAVAILABLE_EVENT = 'englishtok:speech-unavailable';
export const SPEECH_STATUS_EVENT = 'englishtok:speech-status';

interface SpeechUnavailableDetail {
  message: string;
}

interface SpeechStatusDetail {
  status: 'loading' | 'playing' | 'idle';
}

class SpeechService {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private currentAbortController: AbortController | null = null;
  private currentSource: string | null = null;
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

  private setStatus(status: SpeechStatusDetail['status']) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<SpeechStatusDetail>(SPEECH_STATUS_EVENT, {
          detail: { status },
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
    this.currentAbortController?.abort();
    this.currentAbortController = null;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) URL.revokeObjectURL(this.currentAudioUrl);
    this.currentAudioUrl = null;
    this.setStatus('idle');
  };

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

    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    if (!cleanText.trim()) {
      this.reportSpeechUnavailable('لا يوجد نص إنجليزي صالح للنطق.', onError);
      return;
    }

    if (/\p{Script=Arabic}/u.test(cleanText)) {
      this.reportSpeechUnavailable(
        'النطق متاح للنص الإنجليزي فقط؛ ستبقى الترجمة العربية مكتوبة على الشاشة.',
        onError
      );
      return;
    }

    this.lastUnavailableMessage = null;
    const requestId = this.requestId;
    this.currentSource = source;
    const controller = new AbortController();
    this.currentAbortController = controller;
    this.setStatus('loading');

    void this.playCloudSpeech({
      requestId,
      controller,
      text: cleanText.trim(),
      rate,
      pitch,
      gender,
      accent: /^en-GB$/i.test(accent) ? 'en-GB' : 'en-US',
      onStart,
      onEnd,
      onError,
    });
  }

  private async playCloudSpeech({
    requestId,
    controller,
    text,
    rate,
    pitch,
    gender,
    accent,
    onStart,
    onEnd,
    onError,
  }: {
    requestId: number;
    controller: AbortController;
    text: string;
    rate: number;
    pitch: number;
    gender: 'male' | 'female';
    accent: 'en-US' | 'en-GB';
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }) {
    try {
      await new Promise<void>((resolveTimer) => setTimeout(resolveTimer, 0));
      if (requestId !== this.requestId || controller.signal.aborted) return;

      const endpoint = import.meta.env.VITE_TTS_API_URL || '/api/tts';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, rate, pitch, gender, accent }),
        signal: controller.signal,
      });
      if (requestId !== this.requestId) return;

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: unknown }
          | null;
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : response.status === 503
              ? 'خدمة النطق السحابي غير مهيأة. أضف مفتاح Google Cloud Text-to-Speech إلى إعدادات الخادم.'
              : 'تعذر إكمال طلب النطق. حاول مجددًا بعد قليل.';
        this.finishWithError(message, onError);
        return;
      }

      const audioBlob = await response.blob();
      if (requestId !== this.requestId) return;
      if (!audioBlob.size) {
        this.finishWithError('وصل ملف صوتي فارغ من خدمة النطق.', onError);
        return;
      }

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
          'تعذر تشغيل الصوت المستلم من خدمة النطق. تحقق من اتصال الإنترنت وحاول مجددًا.',
          onError
        );
      };
      await audio.play();
    } catch (error) {
      if (requestId !== this.requestId || controller.signal.aborted) return;
      this.finishWithError(
        'تعذر الاتصال بخدمة النطق. تحقق من اتصال الإنترنت وحالة الخادم ثم حاول مجددًا.',
        onError
      );
    }
  }

  private finishWithError(message: string, onError?: (error: unknown) => void) {
    this.clearPlayback();
    this.requestId += 1;
    this.currentSource = null;
    this.reportSpeechUnavailable(message, onError);
  }

  private clearPlayback() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) URL.revokeObjectURL(this.currentAudioUrl);
    this.currentAudioUrl = null;
    this.currentAbortController = null;
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
