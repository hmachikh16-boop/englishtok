import { Capacitor } from '@capacitor/core';
import { NativeTextToSpeech } from './nativeTextToSpeech';
import { speechService } from './speechService';

export interface TutorSpeechOptions {
  text: string;
  rate?: number;
  language?: 'en' | 'fr';
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
  language = 'en',
  onStart,
  onEnd,
  onError,
}: TutorSpeechOptions): Promise<void> => {
  const cleanText = text.trim();
  if (!cleanText) return;
  const speechLanguage = language === 'fr' ? 'fr-FR' : 'en-US';

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
            language: speechLanguage,
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
      // Android may not have a French speech package. Never let the native
      // engine fall back to its default English/Arabic voice: use the app's
      // French speech path instead (device French voice if exposed by the
      // WebView, otherwise the short server-side fallback).
      if (language === 'fr') {
        speechService.speakText({
          source: 'ai-tutor',
          text: cleanText,
          rate,
          gender: 'female',
          accent: 'fr',
          onStart,
          onEnd,
          onError,
        });
        return;
      }
      onError?.(lastError);
    } catch (error) {
      if (language === 'fr') {
        speechService.speakText({
          source: 'ai-tutor',
          text: cleanText,
          rate,
          gender: 'female',
          accent: 'fr',
          onStart,
          onEnd,
          onError,
        });
        return;
      }
      onError?.(error);
    }
    return;
  }

  speechService.speakText({
    source: 'ai-tutor',
    text: cleanText,
    rate,
    gender: 'female',
    accent: language,
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
