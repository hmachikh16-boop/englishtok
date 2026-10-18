/**
 * Sound synthesizer & Text-to-Speech service for EnglishTok
 * 100% offline-ready: uses Web Speech API and Web Audio API
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentSource: string | null = null;
  private requestId = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      this.synth.addEventListener('voiceschanged', () => this.loadVoices());
      window.addEventListener('pagehide', () => this.stopSpeaking());
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private loadVoices = () => {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.stopSpeaking();
  };

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
      const error = new Error('Speech synthesis is not supported in this browser.');
      console.error('[speechService] Unable to speak text:', error);
      onError?.(error);
      return;
    }

    this.stopSpeaking();
    const requestId = this.requestId;
    this.currentSource = source;

    // Clean text of emojis or brackets for clean voice
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    if (!cleanText.trim()) {
      this.currentSource = null;
      onError?.(new Error('Cannot speak empty text.'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = accent || 'en-US';
    utterance.rate = Math.max(0.5, Math.min(1.2, rate));
    utterance.pitch = Math.max(0.7, Math.min(1.4, pitch));

    // Try finding matching voice
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    const englishVoices = this.voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith('en')
    );

    if (englishVoices.length > 0) {
      let selectedVoice: SpeechSynthesisVoice | undefined;
      const matchingAccent = englishVoices.filter(
        (voice) => voice.lang.toLowerCase() === accent.toLowerCase()
      );
      const availableVoices = matchingAccent.length > 0 ? matchingAccent : englishVoices;

      if (gender === 'female') {
        selectedVoice = availableVoices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('google us english')
        );
      } else {
        selectedVoice = availableVoices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('alex')
        );
      }

      utterance.voice = selectedVoice || availableVoices[0];
    }

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
      console.error(`[speechService] Speech failed for "${source}":`, e);
      onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
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
