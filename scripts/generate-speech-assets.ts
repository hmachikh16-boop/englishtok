import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { KokoroTTS } from 'kokoro-js';
import { INITIAL_LESSONS } from '../src/data/lessons';

const OUTPUT_DIRECTORY = join(process.cwd(), 'public', 'audio', 'lessons');
const VOICES = {
  female: { 'en-US': 'af_heart', 'en-GB': 'bf_emma' },
  male: { 'en-US': 'am_michael', 'en-GB': 'bm_george' },
} as const;

async function fileExists(path: string) {
  try {
    return (await stat(path)).size > 0;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function main() {
  const modelStartedAt = Date.now();
  console.info('[speech-assets] Loading Kokoro once for static asset generation...');
  const model = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'cpu',
  });
  console.info(`[speech-assets] Model ready in ${Date.now() - modelStartedAt} ms.`);

  let generated = 0;
  let skipped = 0;
  let totalBytes = 0;
  const entries = INITIAL_LESSONS.flatMap((lesson) =>
    lesson.dialogue.map((line) => {
      const speaker =
        line.speakerId === lesson.characterA.id ? lesson.characterA : lesson.characterB;
      return {
        lessonId: lesson.id,
        lineId: line.id,
        text: line.textEn,
        gender: speaker.voiceGender || 'female',
      } as const;
    })
  );

  for (const [index, entry] of entries.entries()) {
    for (const [accent, voice] of Object.entries(VOICES[entry.gender])) {
      const outputPath = join(
        OUTPUT_DIRECTORY,
        entry.lessonId,
        entry.lineId,
        `${accent}.wav`
      );
      if (await fileExists(outputPath)) {
        skipped += 1;
        continue;
      }

      const audio = await model.generate(entry.text, { voice });
      const blob = audio.toBlob();
      const bytes = Buffer.from(await blob.arrayBuffer());
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, bytes);
      generated += 1;
      totalBytes += bytes.byteLength;
      console.info(
        `[speech-assets] ${index + 1}/${entries.length}: ${entry.lessonId}/${entry.lineId}/${accent}.wav (${bytes.byteLength} bytes)`
      );
    }
  }

  console.info(
    `[speech-assets] Complete: ${generated} generated, ${skipped} already present, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB generated.`
  );
}

main().catch((error: unknown) => {
  console.error('[speech-assets] Generation failed:', error);
  process.exitCode = 1;
});
