const APP_ID = 'com.englishtok.app';
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

const isReleaseAssetUrl = (value: unknown, repository: string): value is string =>
  typeof value === 'string' &&
  value.startsWith(`https://api.github.com/repos/${repository}/releases/assets/`) &&
  /^\d+$/.test(value.slice(`https://api.github.com/repos/${repository}/releases/assets/`.length));

const compareVersions = (left: string, right: string) => {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
};

const getRepository = () => {
  const repository = GITHUB_REPOSITORY;
  if (typeof repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error('لم يُضبط مستودع GitHub لتحديثات التطبيق. أضف VITE_GITHUB_REPOSITORY إلى إعدادات البناء.');
  }
  return repository;
};

const validateManifest = (
  value: unknown,
  repository: string,
  releaseTag: string,
): AppUpdateManifest => {
  if (!isRecord(value)) throw new Error('ملف معلومات التحديث غير صالح.');

  const { schemaVersion, version, packageId, apkUrl, sha256, minimumAndroidSdk, notes } = value;
  if (
    schemaVersion !== 1 ||
    !isStableVersion(version) ||
    releaseTag !== `v${version}` ||
    packageId !== APP_ID ||
    typeof apkUrl !== 'string' ||
    typeof sha256 !== 'string' ||
    !/^[a-f\d]{64}$/i.test(sha256) ||
    typeof minimumAndroidSdk !== 'number' ||
    !Number.isInteger(minimumAndroidSdk) ||
    minimumAndroidSdk < 24 ||
    typeof notes !== 'string'
  ) {
    throw new Error('معلومات الإصدار لا تطابق التطبيق أو تنسيق التحديث المتوقع.');
  }

  const expectedApkUrl =
    `https://github.com/${repository}/releases/download/${releaseTag}/english-tok-${version}.apk`;
  if (apkUrl !== expectedApkUrl) {
    throw new Error('رابط APK لا يطابق مستودع الإصدار المتوقع.');
  }

  return { version, packageId, apkUrl, sha256, minimumAndroidSdk, notes };
};

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
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!releaseResponse.ok) {
    throw new Error(`تعذر التحقق من الإصدار على GitHub (${releaseResponse.status}).`);
  }

  const release: unknown = await releaseResponse.json();
  if (!isRecord(release) || typeof release.tag_name !== 'string' || !Array.isArray(release.assets)) {
    throw new Error('بيانات الإصدار المنشورة غير صالحة.');
  }
  const manifestAsset = release.assets.find(
    (asset) => isRecord(asset) && asset.name === 'update-manifest.json',
  );
  if (
    !isRecord(manifestAsset) ||
    !isReleaseAssetUrl(manifestAsset.url, repository)
  ) {
    throw new Error('الإصدار الأخير لا يتضمن ملف معلومات التحديث المطلوب.');
  }

  const manifestResponse = await fetch(manifestAsset.url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/octet-stream',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!manifestResponse.ok) {
    throw new Error(`تعذر تنزيل معلومات الإصدار (${manifestResponse.status}).`);
  }

  const manifest = validateManifest(await manifestResponse.json(), repository, release.tag_name);
  return compareVersions(manifest.version, installedVersion) > 0 ? manifest : null;
};
