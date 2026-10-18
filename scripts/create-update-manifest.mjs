import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [version, apkPath] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || !apkPath) {
  throw new Error('Usage: node scripts/create-update-manifest.mjs <version> <apk-path>');
}

const config = JSON.parse(await readFile(resolve('capacitor.config.json'), 'utf8'));
const repository = process.env.GITHUB_REPOSITORY;
const releaseTag = `v${version}`;
if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) {
  throw new Error('GITHUB_REPOSITORY must identify the public release repository.');
}

const apkHash = createHash('sha256');
for await (const chunk of createReadStream(resolve(apkPath))) {
  apkHash.update(chunk);
}

const manifest = {
  schemaVersion: 1,
  version,
  packageId: config.appId,
  apkUrl: `https://github.com/${repository}/releases/download/${releaseTag}/english-tok-${version}.apk`,
  sha256: apkHash.digest('hex'),
  minimumAndroidSdk: 24,
  notes: process.env.RELEASE_NOTES ?? '',
  publishedAt: new Date().toISOString(),
};

await writeFile('update-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.info(`Created update metadata for EnglishTok ${version}.`);
