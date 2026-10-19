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
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

if (!process.env.VERCEL) {
  console.log('stage-latest-apk: not a Vercel build, skipping.');
  process.exit(0);
}

const repository = process.env.GITHUB_REPOSITORY || 'hmachikh16-boop/englishtok';
const url = `https://github.com/${repository}/releases/latest/download/english-tok.apk`;
const target = resolve(process.cwd(), 'public', 'english-tok.apk');

try {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }
  mkdirSync(resolve(process.cwd(), 'public'), { recursive: true });
  if (existsSync(target)) unlinkSync(target);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
  console.log(`stage-latest-apk: wrote ${target} (${statSync(target).size} bytes).`);
} catch (error) {
  console.warn(
    `stage-latest-apk: skipped (${error instanceof Error ? error.message : String(error)}).`,
  );
}
