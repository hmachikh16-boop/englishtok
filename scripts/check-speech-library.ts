/**
 * Report lesson texts that have no bundled studio clip.
 *
 * Run `npm run speech:generate` after changing dialogue, vocabulary examples or
 * quiz prompts. The check covers both bundled English voices because the same
 * text can be requested by a lesson character, the vocabulary bank, or
 * placement. French text is not bundled (Kokoro-82M has no French voice).
 *
 * Missing clips fail the check by default. Pass `--allow-missing` during the
 * temporary period when expanded lessons rely on the device voice; unsafe TTS
 * text is still a hard failure.
 *
 * Use `--stage 1` or `--lessons 1-50` to check one publishing batch at a time.
 */
import { existsSync, statSync } from 'node:fs';
import {
  normalizeSpeechText,
  resolveSpeechLanguage,
  speechClipPath,
  speechTextForTts,
  voiceFor,
  type SpeechVoice,
} from '../src/services/speechClip';
import { parseSpeechSelection } from './speechSelection';

const allowMissing = process.argv.slice(2).includes('--allow-missing');
const selection = parseSpeechSelection();
const texts: string[] = [];

for (const lesson of selection.lessons) {
  for (const line of lesson.dialogue ?? []) texts.push(line.textEn);
  for (const word of lesson.vocabulary ?? []) {
    texts.push(word.word);
    texts.push(word.exampleSentence);
  }
  for (const quiz of lesson.quiz ?? []) {
    if (quiz.questionEn) texts.push(quiz.questionEn);
  }
}

const required = new Map<string, { voice: string; text: string }>();
const unsafeTtsTexts: string[] = [];

for (const rawText of texts) {
  const text = normalizeSpeechText(rawText);
  if (!text) continue;
  const language = resolveSpeechLanguage(text, 'en');
  if (language !== 'en') continue;

  // The clip is keyed by the displayed text, but must be synthesized from the
  // classroom-friendly version. A remaining slash pair would be read aloud as
  // "slash ... slash" by the phonemizer.
  const spokenText = speechTextForTts(text);
  if (!spokenText || /\/[^/\n]{1,24}\//.test(spokenText)) {
    unsafeTtsTexts.push(text);
  }

  const voices = new Set<SpeechVoice>([
    voiceFor(language, 'female'),
    voiceFor(language, 'male'),
  ]);
  for (const voice of voices) {
    const path = speechClipPath(text, voice);
    const key = `${voice}:${path}`;
    if (!required.has(key)) required.set(key, { voice, text });
  }
}

const missing: string[] = [];
for (const [key, { voice, text }] of required) {
  const path = key.slice(voice.length + 1);
  if (!existsSync(path) || statSync(path).size === 0) {
    missing.push(`${voice}: ${text}`);
  }
}

const checked = required.size;

if (missing.length) {
  console.error(
    `[speech-check] ${selection.label}: missing ${missing.length} of ${checked} bundled clips:`
  );
  for (const item of missing.slice(0, 40)) console.error(`  - ${item}`);
  if (missing.length > 40) console.error(`  ... and ${missing.length - 40} more.`);
  console.error(
    '[speech-check] Run `npm run speech:generate -- --stage 1` (or --lessons 1-50) and commit the new files.'
  );
  if (allowMissing) {
    console.warn(
      `[speech-check] Continuing with ${missing.length} missing clips because --allow-missing is set; the device voice is the fallback.`,
    );
  } else {
    process.exitCode = 1;
  }
}
if (unsafeTtsTexts.length) {
  console.error('[speech-check] IPA notation would still be read as "slash":');
  for (const item of unsafeTtsTexts.slice(0, 20)) console.error(`  - ${item}`);
  process.exitCode = 1;
}
if (!missing.length && !unsafeTtsTexts.length) {
  console.log(
    `[speech-check] ${selection.label}: all ${checked} bundled clips are present and TTS-safe.`
  );
}
