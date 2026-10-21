import { Capacitor, registerPlugin } from '@capacitor/core';
import { speechService } from './speechService';

interface NativeTextToSpeechPlugin {
  speak(options: {
    text: string;
    rate?: number;
    pitch?: number;
    language?: string;
  }): Promise<void>;
  stop(): Promise<void>;
}

const NativeTextToSpeech = registerPlugin<NativeTextToSpeechPlugin>('TextToSpeech');

export interface TutorSpeechOptions {
  text: string;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Pronounce dynamic tutor text. Bundled English clips are ideal for lessons,
 * but AI replies are new every time, so Android uses the native TTS engine and
 * the web build falls back to the browser's speech synthesis.
 */
export const speakTutorText = async ({
  text,
  rate = 1,
  onStart,
  onEnd,
  onError,
}: TutorSpeechOptions): Promise<void> => {
  const cleanText = text.trim();
  if (!cleanText) return;

  if (Capacitor.getPlatform() === 'android') {
    onStart?.();
    try {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await NativeTextToSpeech.speak({
            text: cleanText,
            rate,
            pitch: 1,
            language: 'en-US',
          });
          onEnd?.();
          return;
        } catch (error) {
          lastError = error;
          const code = (error as { code?: string } | undefined)?.code;
          if (code === 'TTS_STOPPED') {
            onEnd?.();
            return;
          }
          if (code === 'TTS_BUSY' && attempt < 2) {
            await new Promise((resolve) => window.setTimeout(resolve, 150));
            continue;
          }
          if (code !== 'TTS_NOT_READY' || attempt === 2) {
            break;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
      }
      onError?.(lastError);
    } catch (error) {
      onError?.(error);
    }
    return;
  }

  speechService.speakText({
    source: 'ai-tutor',
    text: cleanText,
    rate,
    gender: 'female',
    accent: 'en',
    onStart,
    onEnd,
    onError,
  });
};

export const stopTutorSpeech = (): void => {
  speechService.stopSpeaking('ai-tutor');
  if (Capacitor.getPlatform() === 'android') {
    void NativeTextToSpeech.stop().catch(() => undefined);
  }
};
