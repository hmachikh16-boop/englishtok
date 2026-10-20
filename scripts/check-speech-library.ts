/**
 * Fail the build when a lesson text has no bundled studio clip.
 *
 * Run `npm run speech:generate` after changing dialogue, vocabulary examples or
 * quiz prompts. The check covers both bundled English voices because the same
 * text can be requested by a lesson character, the vocabulary bank, or
 * placement. French text is not bundled (Kokoro-82M has no French voice).
 */
import { existsSync, statSync } from 'node:fs';
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum';
import {
  normalizeSpeechText,
  resolveSpeechLanguage,
  speechClipPath,
  voiceFor,
  type SpeechVoice,
} from '../src/services/speechClip';

const texts: string[] = [];

for (const lesson of LEARNING_PATH_LESSONS) {
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

for (const rawText of texts) {
  const text = normalizeSpeechText(rawText);
  if (!text) continue;
  const language = resolveSpeechLanguage(text, 'en');
  if (language !== 'en') continue;
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
  console.error(`[speech-check] Missing ${missing.length} of ${checked} bundled clips:`);
  for (const item of missing.slice(0, 40)) console.error(`  - ${item}`);
  if (missing.length > 40) console.error(`  ... and ${missing.length - 40} more.`);
  console.error('[speech-check] Run `npm run speech:generate` and commit the new files.');
  process.exitCode = 1;
} else {
  console.log(`[speech-check] All ${checked} bundled clips are present.`);
}
