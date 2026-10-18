import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const version = process.argv[2];
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
if (!match) {
  throw new Error('A stable semantic version (for example 1.2.3) is required.');
}

const [, majorText, minorText, patchText] = match;
const major = Number(majorText);
const minor = Number(minorText);
const patch = Number(patchText);
if (minor > 999 || patch > 999) {
  throw new Error('Android versionCode mapping supports minor and patch values up to 999.');
}

const versionCode = major * 1_000_000 + minor * 1_000 + patch;
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2_100_000_000) {
  throw new Error('The semantic version cannot be represented as a valid Android versionCode.');
}

const gradleFile = resolve('android', 'app', 'build.gradle');
const gradle = await readFile(gradleFile, 'utf8');
if (!/versionCode\s+\d+/.test(gradle) || !/versionName\s+["'][^"']+["']/.test(gradle)) {
  throw new Error(`Could not locate versionCode and versionName in ${gradleFile}.`);
}

const updatedGradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+["'][^"']+["']/, `versionName "${version}"`);
await writeFile(gradleFile, updatedGradle, 'utf8');

console.info(`Prepared Android release ${version} (versionCode ${versionCode}).`);
