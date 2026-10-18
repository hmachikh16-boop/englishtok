/**
 * Sound synthesizer & Text-to-Speech service for EnglishTok
 * 100% offline-ready: uses Web Speech API and Web Audio API
 */

export const SPEECH_UNAVAILABLE_EVENT = 'englishtok:speech-unavailable';

interface SpeechUnavailableDetail {
  message: string;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentSource: string | null = null;
  private requestId = 0;
  private lastUnavailableMessage: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
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
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
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
    if (!this.synth) {
      this.reportSpeechUnavailable(
        'ميزة النطق غير مدعومة في هذا المتصفح.',
        onError
      );
      return;
    }

    this.stopSpeaking();

    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    if (!cleanText.trim()) {
      this.reportSpeechUnavailable('لا يوجد نص إنجليزي صالح للنطق.', onError);
      return;
    }

    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(cleanText)) {
      this.reportSpeechUnavailable(
        'النطق متاح للنص الإنجليزي فقط؛ ستبقى الترجمة العربية مكتوبة على الشاشة.',
        onError
      );
      return;
    }

    let voices: SpeechSynthesisVoice[];
    try {
      voices = this.synth.getVoices();
    } catch (error) {
      this.reportSpeechUnavailable(
        'تعذر فحص أصوات النظام. تحقق من إعدادات الصوت وحاول مجددًا.',
        onError
      );
      return;
    }

    const englishVoices = voices.filter((voice) =>
      /^en-(us|gb)$/i.test(voice.lang)
    );

    if (englishVoices.length === 0) {
      this.reportSpeechUnavailable(
        'لا يوجد صوت إنجليزي متاح على جهازك. ثبّت صوتًا إنجليزيًا (en-US أو en-GB) من إعدادات النظام ثم حاول مجددًا.',
        onError
      );
      return;
    }

    const normalizedAccent = accent.toLowerCase();
    const preferredVoices = englishVoices.filter(
      (voice) => voice.lang.toLowerCase() === normalizedAccent
    );
    const fallbackVoices = englishVoices.filter(
      (voice) => voice.lang.toLowerCase() !== normalizedAccent
    );
    const availableVoices = [...preferredVoices, ...fallbackVoices];
    const genderVoiceNames = gender === 'female'
      ? ['female', 'samantha', 'victoria', 'karen', 'zira', 'aria']
      : ['male', 'david', 'daniel', 'george', 'alex'];
    const selectedVoice =
      availableVoices.find((voice) =>
        genderVoiceNames.some((name) => voice.name.toLowerCase().includes(name))
      ) ?? availableVoices[0];

    if (!selectedVoice || !/^en-(us|gb)$/i.test(selectedVoice.lang)) {
      this.reportSpeechUnavailable(
        'تعذر اختيار صوت إنجليزي مناسب على جهازك.',
        onError
      );
      return;
    }

    this.lastUnavailableMessage = null;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
    utterance.rate = Math.max(0.5, Math.min(1.2, rate));
    utterance.pitch = Math.max(0.7, Math.min(1.4, pitch));

    const requestId = this.requestId;
    this.currentSource = source;
    utterance.onstart = () => {
      if (requestId === this.requestId) onStart?.();
    };

    utterance.onend = () => {
      if (requestId !== this.requestId) return;
      this.currentUtterance = null;
      this.currentSource = null;
      this.requestId += 1;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      if (requestId !== this.requestId) return;
      this.currentUtterance = null;
      this.currentSource = null;
      this.requestId += 1;
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      this.reportSpeechUnavailable(
        'تعذر تشغيل النطق الإنجليزي. تحقق من إعدادات الصوت وحاول مجددًا.',
        onError
      );
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch {
      this.currentUtterance = null;
      this.currentSource = null;
      this.requestId += 1;
      this.reportSpeechUnavailable(
        'تعذر بدء النطق الإنجليزي في هذا المتصفح.',
        onError
      );
    }
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
