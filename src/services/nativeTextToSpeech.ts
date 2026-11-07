import { registerPlugin } from '@capacitor/core';

export interface NativeTextToSpeechPlugin {
  speak(options: {
    text: string;
    rate?: number;
    pitch?: number;
    language?: string;
  }): Promise<void>;
  stop(): Promise<void>;
  /** Optional: used only to boot the engine before the first narration. */
  warmUp?(options?: { language?: string }): Promise<void>;
}

/**
 * One registration shared by the tutor and the lesson audio service. Calling
 * registerPlugin twice for the same name makes Capacitor log a warning.
 */
export const NativeTextToSpeech = registerPlugin<NativeTextToSpeechPlugin>('TextToSpeech');
