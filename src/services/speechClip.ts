/**
 * Shared rules for the pre-generated speech library.
 *
 * The generator script and the running app must agree byte-for-byte on the
 * voice, the text normalisation and the file name, otherwise a clip that was
 * generated will never be found at runtime.
 */

export type SpeechVoice = 'af_heart' | 'am_michael' | 'ff_siwis';

/** Languages the app can speak. English is the course language; French is the second option. */
export const SPEECH_LANGUAGES = ['en', 'fr'] as const;

export type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number];

/** Accepts the current values and the legacy accent codes stored in old profiles. */
export const normalizeSpeechLanguage = (value: unknown): SpeechLanguage =>
  value === 'fr' || value === 'fr-FR' ? 'fr' : 'en';

export const voiceFor = (
  language: string,
  gender: 'male' | 'female' = 'female'
): SpeechVoice => {
  // Kokoro ships a single French voice, so both genders share it.
  if (language === 'fr') return 'ff_siwis';
  return gender === 'male' ? 'am_michael' : 'af_heart';
};

const FRENCH_ACCENTS = /[àâäçéèêëîïôöùûüÿœæÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ]/;

const FRENCH_WORDS =
  /\b(le|la|les|un|une|des|du|est|sont|vous|nous|je|tu|il|elle|et|avec|pour|dans|sur|bonjour|merci|salut|comment|pourquoi|oui|non|très|bien|au revoir|s'il vous plaît)\b/gi;

/** True when the text is clearly French rather than English. */
export const looksFrench = (text: string): boolean => {
  if (FRENCH_ACCENTS.test(text)) return true;
  return (text.match(FRENCH_WORDS)?.length ?? 0) >= 2;
};

/**
 * The language a line should be spoken in. French text is always read with the
 * French voice; everything else follows the learner's preferred language.
 */
export const resolveSpeechLanguage = (
  text: string,
  preferred: unknown = 'en'
): SpeechLanguage => (looksFrench(text) ? 'fr' : normalizeSpeechLanguage(preferred));

/** Strip emoji and reject anything that is not plain Latin-script text. */
export const normalizeSpeechText = (text: string): string | null => {
  const clean = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '').trim();
  if (!clean || /\p{Script=Arabic}/u.test(clean)) return null;
  return clean;
};

/**
 * FNV-1a 64-bit over the UTF-16 code units. Synchronous on purpose: the client
 * needs the URL while rendering, and both sides must derive the same name.
 */
export const speechClipHash = (text: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
};

/** Public URL of the bundled clip for a line, or null when it is not speakable. */
export const speechClipUrl = (
  text: string,
  gender: 'male' | 'female',
  language: string
): string | null => {
  const clean = normalizeSpeechText(text);
  if (!clean) return null;
  return `/audio/tts/${voiceFor(language, gender)}/${speechClipHash(clean)}.ogg`;
};

/** Path of the same clip inside the repository. */
export const speechClipPath = (
  text: string,
  voice: SpeechVoice
): string => `public/audio/tts/${voice}/${speechClipHash(text)}.ogg`;
