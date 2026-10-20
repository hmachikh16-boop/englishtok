import { Capacitor, registerPlugin } from '@capacitor/core';

export type SpeechRecognitionErrorCode =
  | 'unsupported'
  | 'permission-denied'
  | 'no-speech'
  | 'network'
  | 'busy'
  | 'audio'
  | 'server'
  | 'aborted'
  | 'unknown';

export class SpeechRecognitionError extends Error {
  readonly code: SpeechRecognitionErrorCode;

  constructor(code: SpeechRecognitionErrorCode, message: string) {
    super(message);
    this.name = 'SpeechRecognitionError';
    this.code = code;
  }
}

interface NativeSpeechRecognitionPlugin {
  start(options: { language: string }): Promise<{ transcript?: string; confidence?: number }>;
  stop(): Promise<void>;
}

interface BrowserRecognitionResultEvent {
  results: { 0: { 0: { transcript: string } } };
}

interface BrowserRecognitionErrorEvent {
  error?: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: BrowserRecognitionResultEvent) => void) | null;
  onerror: ((event: BrowserRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type BrowserRecognitionConstructor = new () => BrowserSpeechRecognition;

const NativeSpeechRecognition = registerPlugin<NativeSpeechRecognitionPlugin>('SpeechRecognition');

const browserRecognitionConstructor = (): BrowserRecognitionConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const browserWindow = window as unknown as {
    SpeechRecognition?: BrowserRecognitionConstructor;
    webkitSpeechRecognition?: BrowserRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (Capacitor.isNativePlatform()) {
    // The custom Android plugin is registered in MainActivity. The browser
    // fallback remains available when the app is opened in a browser.
    return Capacitor.getPlatform() === 'android' || Boolean(browserRecognitionConstructor());
  }
  return Boolean(browserRecognitionConstructor());
};

const WEB_ERROR_CODES: Record<string, SpeechRecognitionErrorCode> = {
  'not-allowed': 'permission-denied',
  'service-not-allowed': 'permission-denied',
  'audio-capture': 'audio',
  'no-speech': 'no-speech',
  network: 'network',
  aborted: 'aborted',
  'language-not-supported': 'unsupported',
  'phrases-not-supported': 'unsupported',
  'bad-grammar': 'unknown',
};

const nativeErrorCode = (error: unknown): SpeechRecognitionErrorCode => {
  const value = error as { code?: string } | undefined;
  const code = value?.code?.toLowerCase().replace(/_/g, '-');
  if (code === 'permission-denied' || code === 'insufficient-permissions') return 'permission-denied';
  if (code === 'no-speech' || code === 'no-match' || code === 'speech-timeout') return 'no-speech';
  if (code === 'network' || code === 'network-timeout') return 'network';
  if (code === 'busy' || code === 'recognizer-busy') return 'busy';
  if (code === 'audio') return 'audio';
  if (code === 'server') return 'server';
  if (code === 'aborted' || code === 'client') return 'aborted';
  if (code === 'unavailable' || code === 'unsupported') return 'unsupported';
  return 'unknown';
};

const nativeErrorMessage = (code: SpeechRecognitionErrorCode): string => {
  switch (code) {
    case 'permission-denied':
      return 'لم يتم السماح باستخدام الميكروفون.';
    case 'no-speech':
      return 'لم نسمع صوتًا واضحًا.';
    case 'network':
      return 'تعذر الاتصال بخدمة التعرف على الصوت.';
    case 'busy':
      return 'الميكروفون مشغول الآن. حاول مرة أخرى.';
    case 'audio':
      return 'تعذر الوصول إلى الميكروفون.';
    case 'server':
      return 'خدمة التعرف على الصوت غير متاحة الآن.';
    case 'unsupported':
      return 'التسجيل الصوتي غير متاح على هذا الجهاز.';
    case 'aborted':
      return 'أُلغي التسجيل.';
    default:
      return 'تعذر تشغيل الميكروفون.';
  }
};

export interface SpeechRecognitionSession {
  result: Promise<string>;
  stop: () => void;
}

/**
 * Use Android's own SpeechRecognizer inside Capacitor. Android WebView does not
 * expose the Web Speech API, which made the microphone button report that
 * recording was unavailable. Desktop browsers still use the Web Speech API.
 */
export const startSpeechRecognition = (language = 'en-US'): SpeechRecognitionSession => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    let cancelled = false;
    const result = NativeSpeechRecognition.start({ language })
      .then((value) => {
        if (cancelled) throw new SpeechRecognitionError('aborted', nativeErrorMessage('aborted'));
        const transcript = value?.transcript?.trim() ?? '';
        if (!transcript) throw new SpeechRecognitionError('no-speech', nativeErrorMessage('no-speech'));
        return transcript;
      })
      .catch((error: unknown) => {
        if (cancelled) throw new SpeechRecognitionError('aborted', nativeErrorMessage('aborted'));
        const code = nativeErrorCode(error);
        throw new SpeechRecognitionError(code, nativeErrorMessage(code));
      });

    return {
      result,
      stop: () => {
        cancelled = true;
        void NativeSpeechRecognition.stop().catch(() => undefined);
      },
    };
  }

  const Recognition = browserRecognitionConstructor();
  if (!Recognition) {
    return {
      result: Promise.reject(
        new SpeechRecognitionError('unsupported', 'هذا المتصفح لا يدعم التعرف على الصوت.'),
      ),
      stop: () => undefined,
    };
  }

  let recognition: BrowserSpeechRecognition | null = null;
  let settled = false;
  let cancelled = false;

  const result = new Promise<string>((resolve, reject) => {
    const succeed = (transcript: string) => {
      if (settled) return;
      settled = true;
      resolve(transcript);
    };
    const fail = (code: SpeechRecognitionErrorCode, message: string) => {
      if (settled) return;
      settled = true;
      reject(new SpeechRecognitionError(code, message));
    };

    try {
      recognition = new Recognition();
    } catch {
      fail('unsupported', 'هذا المتصفح لا يدعم التعرف على الصوت.');
      return;
    }

    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? '';
      if (transcript) succeed(transcript);
      else fail('no-speech', nativeErrorMessage('no-speech'));
    };
    recognition.onerror = (event) => {
      const code = WEB_ERROR_CODES[event.error ?? ''] ?? 'unknown';
      if (cancelled || code === 'aborted') {
        fail('aborted', nativeErrorMessage('aborted'));
        return;
      }
      fail(code, nativeErrorMessage(code));
    };
    recognition.onend = () => {
      if (!settled) {
        fail(cancelled ? 'aborted' : 'no-speech', nativeErrorMessage(cancelled ? 'aborted' : 'no-speech'));
      }
    };

    try {
      recognition.start();
    } catch {
      fail('unsupported', 'هذا المتصفح لا يدعم التعرف على الصوت.');
    }
  });

  return {
    result,
    stop: () => {
      cancelled = true;
      try {
        recognition?.abort?.();
      } catch {
        // The recognition session may already have ended.
      }
    },
  };
};
