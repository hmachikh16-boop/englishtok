import { IS_GOLD_EDITION } from '../config/edition';

const APP_ID = IS_GOLD_EDITION ? 'com.englishtok.gold' : 'com.englishtok.app';
const GITHUB_RELEASE_PREFIX = IS_GOLD_EDITION ? 'gold-v' : 'v';
const MINIMUM_ANDROID_SDK = 24;
const GITHUB_REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY;
const GOLD_UPDATE_MANIFEST_URL =
  'https://englishtok-eight.vercel.app/download/gold-latest.json';

export interface AppUpdateManifest {
  version: string;
  packageId: string;
  apkUrl: string;
  sha256: string;
  minimumAndroidSdk: number;
  notes: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStableVersion = (value: unknown): value is string =>
  typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);

const compareVersions = (left: string, right: string) => {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
};

/**
 * AbortSignal.timeout is missing on older Android WebViews, so fall back to a
 * manual controller. A failed update check is otherwise silent on those
 * devices.
 */
const timeoutSignal = (milliseconds: number): AbortSignal | undefined => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(milliseconds);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), milliseconds);
    return controller.signal;
  }
  return undefined;
};

const getRepository = () => {
  const repository = GITHUB_REPOSITORY;
  if (typeof repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error('لم يُضبط مستودع GitHub لتحديثات التطبيق. أضف VITE_GITHUB_REPOSITORY إلى إعدادات البناء.');
  }
  return repository;
};

const assetDigest = (asset: Record<string, unknown>): string => {
  const digest = asset.digest;
  if (typeof digest !== 'string') return '';
  const match = /^sha256:([a-f\d]{64})$/i.exec(digest);
  return match ? match[1].toLowerCase() : '';
};

const apkFileName = (version: string): string =>
  IS_GOLD_EDITION ? `lin-go-gold-${version}.apk` : `english-tok-${version}.apk`;

const expectedApkUrl = (repository: string, version: string): string =>
  `https://github.com/${repository}/releases/download/${GITHUB_RELEASE_PREFIX}${version}/${apkFileName(version)}`;

const versionFromRelease = (release: Record<string, unknown>): string | null => {
  if (typeof release.tag_name !== 'string') return null;
  if (!release.tag_name.startsWith(GITHUB_RELEASE_PREFIX)) return null;
  const version = release.tag_name.slice(GITHUB_RELEASE_PREFIX.length);
  return isStableVersion(version) ? version : null;
};

const toManifest = (
  release: Record<string, unknown>,
  repository: string,
  version: string,
  installedVersion: string,
): AppUpdateManifest | null => {
  if (compareVersions(version, installedVersion) <= 0) return null;
  if (!Array.isArray(release.assets)) {
    throw new Error('الإصدار الأخير لا يحتوي على ملفات منشورة.');
  }

  const apkAsset = release.assets.find(
    (asset) => isRecord(asset) && asset.name === apkFileName(version),
  );
  if (!isRecord(apkAsset) || typeof apkAsset.browser_download_url !== 'string') {
    throw new Error('الإصدار الأخير لا يتضمن ملف APK المتوقع.');
  }

  const expectedUrl = expectedApkUrl(repository, version);
  if (apkAsset.browser_download_url !== expectedUrl) {
    throw new Error('رابط APK لا يطابق مستودع الإصدار المتوقع.');
  }

  return {
    version,
    packageId: APP_ID,
    apkUrl: expectedUrl,
    sha256: assetDigest(apkAsset),
    minimumAndroidSdk: MINIMUM_ANDROID_SDK,
    notes: typeof release.body === 'string' ? release.body : '',
  };
};

/**
 * Gold also gets a first-party manifest on the official site. It is written by
 * the Vercel staging step after the APK itself is downloaded, so the version,
 * size and SHA-256 are always from the same file. This avoids depending on
 * GitHub API rate limits just to discover an update.
 */
const readGoldUpdateManifest = async (
  repository: string,
  installedVersion: string,
): Promise<AppUpdateManifest | null> => {
  const response = await fetch(GOLD_UPDATE_MANIFEST_URL, {
    cache: 'no-store',
    signal: timeoutSignal(15_000),
  });
  if (!response.ok) {
    throw new Error(`Gold update manifest HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error('Gold update manifest is not an object.');
  }
  if (payload.packageId !== APP_ID) {
    throw new Error('Gold update manifest belongs to another package.');
  }
  if (!isStableVersion(payload.version)) {
    throw new Error('Gold update manifest has an invalid version.');
  }
  if (compareVersions(payload.version, installedVersion) <= 0) {
    return null;
  }
  if (typeof payload.sha256 !== 'string' || !/^[a-f\d]{64}$/i.test(payload.sha256)) {
    throw new Error('Gold update manifest has an invalid SHA-256.');
  }

  return {
    version: payload.version,
    packageId: APP_ID,
    // The downloader always uses the official first-party APK path; the URL in
    // a remote manifest is never used for the transfer itself.
    apkUrl: expectedApkUrl(repository, payload.version),
    sha256: payload.sha256.toLowerCase(),
    minimumAndroidSdk:
      typeof payload.minimumAndroidSdk === 'number'
        ? payload.minimumAndroidSdk
        : MINIMUM_ANDROID_SDK,
    notes: typeof payload.notes === 'string' ? payload.notes : '',
  };
};

/**
 * Reads the newest published release from the GitHub REST API.
 *
 * Free uses `releases/latest`. Gold publishes every build as a prerelease
 * (`gold-vX.Y.Z`), and GitHub excludes prereleases from `releases/latest`.
 * Gold therefore reads the release list and picks the highest Gold version.
 * This keeps the two side-by-side editions on completely separate update
 * channels. Neither app can accidentally download the other edition.
 *
 * We deliberately avoid downloading `update-manifest.json`: GitHub redirects
 * release assets to a host without CORS headers, while the releases API is
 * CORS-enabled and already carries the APK URL and SHA-256 digest.
 */
export const checkForAppUpdate = async (
  installedVersion: string,
): Promise<AppUpdateManifest | null> => {
  if (!isStableVersion(installedVersion)) {
    throw new Error('تعذر قراءة رقم إصدار التطبيق المثبت.');
  }
  const repository = getRepository();

  if (!IS_GOLD_EDITION) {
    const releaseResponse = await fetch(
      `https://api.github.com/repos/${repository}/releases/latest`,
      {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json' },
        signal: timeoutSignal(15_000),
      },
    );
    if (!releaseResponse.ok) {
      throw new Error(`تعذر التحقق من الإصدار على GitHub (${releaseResponse.status}).`);
    }

    const release: unknown = await releaseResponse.json();
    if (!isRecord(release) || typeof release.tag_name !== 'string') {
      throw new Error('بيانات الإصدار المنشورة غير صالحة.');
    }
    const version = versionFromRelease(release);
    if (!version) {
      throw new Error('رقم الإصدار المنشور غير صالح.');
    }
    return toManifest(release, repository, version, installedVersion);
  }

  // Gold checks the first-party manifest first. The GitHub release list is a
  // fallback only, so a temporary API limit or a stale deploy cannot strand
  // Gold users without an update path.
  try {
    return await readGoldUpdateManifest(repository, installedVersion);
  } catch (manifestError) {
    console.warn('Gold update manifest unavailable; trying GitHub releases.', manifestError);
  }

  const releasesResponse = await fetch(
    `https://api.github.com/repos/${repository}/releases?per_page=30`,
    {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
      signal: timeoutSignal(15_000),
    },
  );
  if (!releasesResponse.ok) {
    throw new Error(`تعذر التحقق من إصدار Gold على GitHub (${releasesResponse.status}).`);
  }

  const payload: unknown = await releasesResponse.json();
  if (!Array.isArray(payload)) {
    throw new Error('قائمة إصدارات Gold المنشورة غير صالحة.');
  }

  const candidates = payload
    .filter((release): release is Record<string, unknown> => isRecord(release))
    .filter((release) => release.draft !== true)
    .map((release) => ({ release, version: versionFromRelease(release) }))
    .filter(
      (candidate): candidate is { release: Record<string, unknown>; version: string } =>
        candidate.version !== null,
    )
    .sort((left, right) => compareVersions(right.version, left.version));

  const newest = candidates[0];
  if (!newest) {
    throw new Error('لم يُنشر أي إصدار Gold بعد.');
  }
  return toManifest(newest.release, repository, newest.version, installedVersion);
};
