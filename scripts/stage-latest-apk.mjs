#!/usr/bin/env node
/**
 * Stage the newest published APK into public/ so the website can offer a
 * first-party download.
 *
 * GitHub release assets are delivered through an Azure-backed host that some
 * mobile browsers fail to finish, so the site serves its own copy as a plain
 * octet-stream attachment instead.
 *
 * Only runs inside a Vercel build, otherwise the 45 MB file would be bundled
 * into the Android app itself. Failures never break the build.
 */
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

if (!process.env.VERCEL) {
  console.log('stage-latest-apk: not a Vercel build, skipping.');
  process.exit(0);
}

const repository = process.env.GITHUB_REPOSITORY || 'hmachikh16-boop/englishtok';
const url = `https://github.com/${repository}/releases/latest/download/english-tok.apk`;
const manifestUrl = `https://github.com/${repository}/releases/latest/download/update-manifest.json`;
const target = resolve(process.cwd(), 'public', 'english-tok.apk');
const latestDir = resolve(process.cwd(), 'public', 'download');
const latestFile = resolve(latestDir, 'latest.json');

const sha256File = (file) =>
  new Promise((resolveHash, rejectHash) => {
    const hash = createHash('sha256');
    createReadStream(file)
      .on('error', rejectHash)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolveHash(hash.digest('hex').toUpperCase()));
  });

try {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`APK HTTP ${response.status}`);
  }
  mkdirSync(resolve(process.cwd(), 'public'), { recursive: true });
  if (existsSync(target)) unlinkSync(target);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));

  let releaseManifest = null;
  try {
    const manifestResponse = await fetch(manifestUrl, { redirect: 'follow' });
    if (manifestResponse.ok) {
      releaseManifest = await manifestResponse.json();
    }
  } catch {
    console.warn('stage-latest-apk: release manifest unavailable; using package version.');
  }

  const packageVersion = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ).version;
  const version =
    typeof releaseManifest?.version === 'string' &&
    /^\d+\.\d+\.\d+$/.test(releaseManifest.version)
      ? releaseManifest.version
      : packageVersion;
  const sha256 = await sha256File(target);
  const size = statSync(target).size;

  const latest = {
    version,
    packageId: releaseManifest?.packageId || 'com.englishtok.app',
    apkUrl: '/english-tok.apk',
    sha256,
    size,
    minimumAndroidSdk: releaseManifest?.minimumAndroidSdk || 24,
    notes: releaseManifest?.notes || '',
    releaseUrl: `https://github.com/${repository}/releases/latest`,
  };

  mkdirSync(latestDir, { recursive: true });
  writeFileSync(latestFile, `${JSON.stringify(latest, null, 2)}\n`, 'utf8');
  console.log(
    `stage-latest-apk: wrote ${target} (${size} bytes) and ${latestFile} (${version}).`,
  );
} catch (error) {
  console.warn(
    `stage-latest-apk: skipped (${error instanceof Error ? error.message : String(error)}).`,
  );
}
