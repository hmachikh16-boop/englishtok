import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum.ts';

const contentDirectory = resolve(process.cwd(), 'public', 'content');
const outputFile = resolve(contentDirectory, 'learning-path.json');
const manifestFile = resolve(contentDirectory, 'content-manifest.json');
const frenchFile = resolve(contentDirectory, 'learning-path-fr.json');

const digest = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 16);

const englishPayload = `${JSON.stringify(
  { schemaVersion: 4, lessons: LEARNING_PATH_LESSONS },
  null,
  2,
)}\n`;

await mkdir(contentDirectory, { recursive: true });
await writeFile(outputFile, englishPayload, 'utf8');

const manifest: {
  schemaVersion: 1;
  generatedAt: string;
  en: { version: string; url: string; bytes: number };
  fr?: { version: string; url: string; bytes: number };
} = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  en: {
    version: digest(englishPayload),
    url: '/content/learning-path.json',
    bytes: Buffer.byteLength(englishPayload),
  },
};

try {
  const frenchPayload = await readFile(frenchFile, 'utf8');
  manifest.fr = {
    version: digest(frenchPayload),
    url: '/content/learning-path-fr.json',
    bytes: Buffer.byteLength(frenchPayload),
  };
} catch {
  /* French content is optional in this checkout. */
}

await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.info(
  `Exported ${LEARNING_PATH_LESSONS.length} lessons to public/content/learning-path.json ` +
    `(manifest ${manifest.en.version}).`,
);
