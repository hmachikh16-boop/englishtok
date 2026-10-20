/**
 * Build the bundled speech library: one Opus clip per unique dialogue line and
 * voice, written to public/audio/tts/<voice>/<hash>.ogg.
 *
 * Usage:
 *   npx tsx scripts/generate-speech-library.ts            # every dialogue line
 *   npx tsx scripts/generate-speech-library.ts --limit 40 # quick sample
 *
 * Existing clips are skipped, so the script can be stopped and resumed.
 * FFMPEG_PATH may point at any ffmpeg build that includes libopus.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { KokoroTTS } from 'kokoro-js';
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum';
import {
  normalizeSpeechText,
  resolveSpeechLanguage,
  speechClipPath,
  voiceFor,
  type SpeechVoice,
} from '../src/services/speechClip';

const FFMPEG =
  process.env.FFMPEG_PATH ||
  join(process.cwd(), 'tools', 'ffmpeg-tool', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const BITRATE = process.env.SPEECH_BITRATE || '24k';
const LIMIT = (() => {
  const index = process.argv.indexOf('--limit');
  if (index === -1) return Number.POSITIVE_INFINITY;
  const value = Number.parseInt(process.argv[index + 1] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : Number.POSITIVE_INFINITY;
})();

interface ClipJob {
  voice: SpeechVoice;
  text: string;
  target: string;
}

const VOICE_PRIORITY: Record<SpeechVoice, number> = {
  af_heart: 0,
  am_michael: 1,
  ff_siwis: 2,
};

const collectJobs = (): ClipJob[] => {
  const lessons = LEARNING_PATH_LESSONS;
  const jobs = new Map<string, ClipJob>();

  const addText = (rawText: string | undefined) => {
    if (!rawText) return;
    const text = normalizeSpeechText(rawText);
    if (!text) return;

    // The same text can be requested with different voices: a lesson line uses
    // the speaking character, the vocabulary bank uses the female voice, and
    // placement/exam playback may use either. Bundle both English voices so a
    // clip is always available regardless of which screen asks for it.
    const language = resolveSpeechLanguage(text, 'en');
    // Kokoro-82M only ships English voices. French text is left to the device
    // voice fallback instead of asking for a voice the model does not have.
    if (language !== 'en') return;
    const voices = new Set<SpeechVoice>([
      voiceFor(language, 'female'),
      voiceFor(language, 'male'),
    ]);
    for (const voice of voices) {
      const relative = speechClipPath(text, voice);
      if (jobs.has(relative)) continue;
      jobs.set(relative, { voice, text, target: join(process.cwd(), relative) });
    }
  };

  for (const lesson of lessons) {
    for (const line of lesson.dialogue ?? []) addText(line.textEn);
    for (const word of lesson.vocabulary ?? []) {
      addText(word.word);
      addText(word.exampleSentence);
    }
    for (const quiz of lesson.quiz ?? []) addText(quiz.questionEn);
  }

  // Finish one voice completely before starting the next, so a partial library
  // already covers every lesson in that voice.
  return [...jobs.values()].sort(
    (a, b) => VOICE_PRIORITY[a.voice] - VOICE_PRIORITY[b.voice]
  );
};

const encodeOpus = (wav: Buffer): Buffer =>
  execFileSync(
    FFMPEG,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-ac',
      '1',
      '-c:a',
      'libopus',
      '-b:a',
      BITRATE,
      '-application',
      'voip',
      '-f',
      'ogg',
      'pipe:1',
    ],
    { input: wav, maxBuffer: 64 * 1024 * 1024 }
  );

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${minutes}m ${String(rest).padStart(2, '0')}s`;
};

async function main() {
  console.log(`[speech-library] ffmpeg: ${FFMPEG}`);
  console.log(`[speech-library] bitrate: ${BITRATE}`);

  const all = collectJobs();
  const pending = all.filter((job) => !existsSync(job.target)).slice(0, LIMIT);
  console.log(
    `[speech-library] ${all.length} unique clips in the library, ${pending.length} still to generate.`
  );
  if (!pending.length) {
    console.log('[speech-library] Nothing to do.');
    return;
  }

  const startedAt = Date.now();
  const model = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q4',
    device: 'cpu',
  });
  console.log(`[speech-library] model ready in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`);

  let generated = 0;
  let failed = 0;
  let bytes = 0;
  let audioSeconds = 0;

  for (const [index, job] of pending.entries()) {
    try {
      const audio = await model.generate(job.text, { voice: job.voice as never });
      const wav = Buffer.from(await audio.toBlob().arrayBuffer());
      audioSeconds += wav.byteLength / 2 / 24000;
      const ogg = encodeOpus(wav);
      mkdirSync(dirname(job.target), { recursive: true });
      writeFileSync(job.target, ogg);
      generated += 1;
      bytes += ogg.byteLength;
    } catch (error) {
      failed += 1;
      console.warn(
        `[speech-library] failed: ${job.voice} "${job.text.slice(0, 50)}" — ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const done = index + 1;
    if (done % 10 === 0 || done === pending.length) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const perClip = elapsed / done;
      const remaining = perClip * (pending.length - done);
      console.log(
        `[speech-library] ${done}/${pending.length} | ${(bytes / 1024 / 1024).toFixed(1)} MB | ` +
          `${(audioSeconds / elapsed).toFixed(2)}x realtime | elapsed ${formatDuration(elapsed)} | ` +
          `eta ${formatDuration(remaining)}`
      );
    }
  }

  const largest = pending
    .map((job) => ({ job, size: existsSync(job.target) ? statSync(job.target).size : 0 }))
    .sort((a, b) => b.size - a.size)[0];
  console.log(
    `[speech-library] complete: ${generated} generated, ${failed} failed, ` +
      `${(bytes / 1024 / 1024).toFixed(2)} MB written in ${formatDuration((Date.now() - startedAt) / 1000)}.`
  );
  if (largest?.size) {
    console.log(`[speech-library] largest clip: ${(largest.size / 1024).toFixed(1)} KB`);
  }
}

main().catch((error: unknown) => {
  console.error('[speech-library] Generation failed:', error);
  process.exitCode = 1;
});
