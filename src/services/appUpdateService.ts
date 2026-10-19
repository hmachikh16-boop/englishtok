const APP_ID = 'com.englishtok.app';
const MINIMUM_ANDROID_SDK = 24;
const GITHUB_REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY;

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

/**
 * Reads the newest published release straight from the GitHub REST API.
 *
 * We deliberately avoid downloading the `update-manifest.json` release asset:
 * GitHub redirects asset downloads to release-assets.githubusercontent.com,
 * which does not send CORS headers, so a WebView fetch is blocked. The
 * releases/latest payload itself is CORS-enabled and already carries
 * everything we need (version tag, APK browser URL, digest and release notes).
 */
export const checkForAppUpdate = async (
  installedVersion: string,
): Promise<AppUpdateManifest | null> => {
  if (!isStableVersion(installedVersion)) {
    throw new Error('تعذر قراءة رقم إصدار التطبيق المثبت.');
  }
  const repository = getRepository();
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
  if (
    !isRecord(release) ||
    typeof release.tag_name !== 'string' ||
    !Array.isArray(release.assets)
  ) {
    throw new Error('بيانات الإصدار المنشورة غير صالحة.');
  }

  const version = release.tag_name.replace(/^v/, '');
  if (!isStableVersion(version)) {
    throw new Error('رقم الإصدار المنشور غير صالح.');
  }
  if (compareVersions(version, installedVersion) <= 0) {
    return null;
  }

  const apkName = `english-tok-${version}.apk`;
  const apkAsset = release.assets.find(
    (asset) => isRecord(asset) && asset.name === apkName,
  );
  if (!isRecord(apkAsset) || typeof apkAsset.browser_download_url !== 'string') {
    throw new Error('الإصدار الأخير لا يتضمن ملف APK المتوقع.');
  }

  const expectedApkUrl =
    `https://github.com/${repository}/releases/download/v${version}/${apkName}`;
  if (apkAsset.browser_download_url !== expectedApkUrl) {
    throw new Error('رابط APK لا يطابق مستودع الإصدار المتوقع.');
  }

  return {
    version,
    packageId: APP_ID,
    apkUrl: expectedApkUrl,
    sha256: assetDigest(apkAsset),
    minimumAndroidSdk: MINIMUM_ANDROID_SDK,
    notes: typeof release.body === 'string' ? release.body : '',
  };
};
