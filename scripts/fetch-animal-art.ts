#!/usr/bin/env node
/**
 * Refresh the animal portraits bundled with the motivation cards.
 *
 * Source: Twemoji 15.1.0 (https://github.com/jdecked/twemoji), CC-BY 4.0.
 * The SVGs are stored locally so the cards work offline inside the Android app.
 *
 * Usage: npx tsx scripts/fetch-animal-art.ts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ANIMAL_ASSET_SOURCES } from '../src/data/animals';

const SOURCE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg';
const target = resolve('public', 'animals');
const batchSize = 8;

await mkdir(target, { recursive: true });

const failures: string[] = [];

for (let index = 0; index < ANIMAL_ASSET_SOURCES.length; index += batchSize) {
  const batch = ANIMAL_ASSET_SOURCES.slice(index, index + batchSize);
  await Promise.all(
    batch.map(async ({ asset, codepoint }) => {
      try {
        const response = await fetch(`${SOURCE}/${codepoint}.svg`);
        if (!response.ok) {
          failures.push(`${asset}: HTTP ${response.status}`);
          return;
        }
        const svg = await response.text();
        if (!svg.trimStart().startsWith('<svg')) {
          failures.push(`${asset}: response was not SVG`);
          return;
        }
        await writeFile(resolve(target, asset), svg, 'utf8');
        console.log(`saved ${asset}`);
      } catch (error) {
        failures.push(`${asset}: ${(error as Error).message}`);
      }
    }),
  );
}

await writeFile(
  resolve(target, 'ATTRIBUTION.txt'),
  [
    'Animal artwork: Twemoji 15.1.0',
    'Source: https://github.com/jdecked/twemoji',
    'Copyright 2020 Twitter, Inc and other contributors.',
    'Licensed under CC-BY 4.0: https://creativecommons.org/licenses/by/4.0/',
    '',
    'The SVGs are bundled unmodified and scaled by EnglishTok at render time.',
  ].join('\n'),
  'utf8',
);

if (failures.length > 0) {
  console.error(`\n${failures.length} animal artwork file(s) failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nDownloaded ${ANIMAL_ASSET_SOURCES.length} animal portraits to ${target}`);
