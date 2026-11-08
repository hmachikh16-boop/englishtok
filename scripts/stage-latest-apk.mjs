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
  closeSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
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
// Read the Gold flavor version from Gradle when available (local builds). On
// Vercel the android/ folder is not present, so fall back to the committed
// manifest to avoid breaking the build.
let goldVersion = null;
const gradlePath = resolve(process.cwd(), 'android', 'app', 'build.gradle');
if (existsSync(gradlePath)) {
  try {
    const gradleSource = readFileSync(gradlePath, 'utf8');
    const goldFlavor = /gold\s*\{([\s\S]*?)\}/.exec(gradleSource)?.[1] ?? '';
    goldVersion = /versionName\s+["']([^"']+)["']/.exec(goldFlavor)?.[1] ?? null;
  } catch {
    goldVersion = null;
  }
}
if (!goldVersion || !/^\d+\.\d+\.\d+$/.test(goldVersion)) {
  try {
    const committed = JSON.parse(readFileSync(resolve(process.cwd(), 'public', 'download', 'gold-latest.json'), 'utf8'));
    if (/^\d+\.\d+\.\d+$/.test(committed.version)) goldVersion = committed.version;
  } catch {
    // ignore
  }
}
if (!goldVersion || !/^\d+\.\d+\.\d+$/.test(goldVersion)) {
  goldVersion = '1.1.22';
}
const goldTarget = resolve(process.cwd(), 'public', `lin-go-gold-${goldVersion}.apk`);
const goldUrl = `https://github.com/${repository}/releases/download/gold-v${goldVersion}/lin-go-gold-${goldVersion}.apk`;
const latestDir = resolve(process.cwd(), 'public', 'download');
const latestFile = resolve(latestDir, 'latest.json');
const goldLatestFile = resolve(latestDir, 'gold-latest.json');

const sha256File = (file) =>
  new Promise((resolveHash, rejectHash) => {
    const hash = createHash('sha256');
    createReadStream(file)
      .on('error', rejectHash)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolveHash(hash.digest('hex').toUpperCase()));
  });

/**
 * Refuse to publish a manifest that points at a missing or non-APK file.
 *
 * Vercel rewrites unknown paths to index.html, so a missing APK used to be
 * downloaded as a ~7 KB HTML page and saved with an .apk name. This guard runs
 * on Vercel only: local builds may legitimately run without the 90 MB binary.
 */
const verifyGoldBundle = () => {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(goldLatestFile, 'utf8'));
  } catch (error) {
    throw new Error(
      `Gold manifest is unreadable (${error instanceof Error ? error.message : String(error)}).`,
    );
  }

  const version = manifest?.version;
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Gold manifest has an invalid version.');
  }

  const apk = resolve(process.cwd(), 'public', `lin-go-gold-${version}.apk`);
  if (!existsSync(apk)) {
    throw new Error(`Gold APK ${version} is missing from public/.`);
  }

  const size = statSync(apk).size;
  if (typeof manifest.size === 'number' && manifest.size !== size) {
    throw new Error(
      `Gold APK ${version} size mismatch: manifest ${manifest.size} bytes, file ${size} bytes.`,
    );
  }

  const header = Buffer.alloc(4);
  const fd = openSync(apk, 'r');
  try {
    readSync(fd, header, 0, 4, 0);
  } finally {
    closeSync(fd);
  }
  if (header[0] !== 0x50 || header[1] !== 0x4b || header[2] !== 0x03 || header[3] !== 0x04) {
    throw new Error(`Gold APK ${version} is not a ZIP/APK file.`);
  }

  return { version, size };
};

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
    `stage-latest-apk: Free APK was not staged (${error instanceof Error ? error.message : String(error)}).`,
  );
}

// Gold is a prerelease, so it has an explicit tag instead of "latest". Keep it
// on the same first-party origin as Free: the GitHub asset host can pause
// mobile downloads at 100% before the file becomes visible in Downloads.
//
// This runs independently of Free staging: a temporary problem with the Free
// release must never take down the Gold update manifest.
try {
  const goldResponse = await fetch(goldUrl, { redirect: 'follow' });
  if (!goldResponse.ok || !goldResponse.body) {
    throw new Error(`Gold APK HTTP ${goldResponse.status}`);
  }
  mkdirSync(resolve(process.cwd(), 'public'), { recursive: true });
  if (existsSync(goldTarget)) unlinkSync(goldTarget);
  await pipeline(Readable.fromWeb(goldResponse.body), createWriteStream(goldTarget));
  const goldSha256 = await sha256File(goldTarget);
  const goldSize = statSync(goldTarget).size;
  const goldLatest = {
    version: goldVersion,
    packageId: 'com.englishtok.gold',
    apkUrl: `/lin-go-gold-${goldVersion}.apk`,
    sha256: goldSha256,
    size: goldSize,
    minimumAndroidSdk: 24,
    notes:
      'تحديث Gold ' + goldVersion + ': زر «وضع التجربة المجانية» في لوحة الإدارة — عند تفعيله يفتح التطبيق بدون كود، وإيقافه يعيد طلب الكود المفعّل فورًا. مع ~900 درس ونوافذ أنيقة وألعاب أذكى.',
    releaseUrl: `https://github.com/${repository}/releases/tag/gold-v${goldVersion}`,
    publishedAt: new Date().toISOString(),
  };
  mkdirSync(latestDir, { recursive: true });
  writeFileSync(goldLatestFile, `${JSON.stringify(goldLatest, null, 2)}\n`, 'utf8');
  console.log(
    `stage-latest-apk: wrote ${goldTarget} (${goldSize} bytes) and ${goldLatestFile} (${goldVersion}).`,
  );
} catch (error) {
  console.warn(
    `stage-latest-apk: Gold APK was not staged (${error instanceof Error ? error.message : String(error)}).`,
  );
}

if (process.env.VERCEL) {
  try {
    const verified = verifyGoldBundle();
    console.log(
      `stage-latest-apk: verified Gold APK ${verified.version} (${verified.size} bytes) matches the manifest.`,
    );
  } catch (error) {
    console.error(
      `stage-latest-apk: refusing to publish a broken Gold download (${error instanceof Error ? error.message : String(error)}).`,
    );
    process.exit(1);
  }
}
