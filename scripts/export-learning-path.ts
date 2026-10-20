import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum.ts';

const contentDirectory = resolve(process.cwd(), 'public', 'content');
const outputFile = resolve(contentDirectory, 'learning-path.json');

await mkdir(contentDirectory, { recursive: true });
await writeFile(
  outputFile,
  `${JSON.stringify({ schemaVersion: 4, lessons: LEARNING_PATH_LESSONS }, null, 2)}\n`,
  'utf8',
);

console.info(`Exported ${LEARNING_PATH_LESSONS.length} lessons to public/content/learning-path.json`);
