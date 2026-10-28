/**
 * Public download endpoints. Keep every update route on the official site so
 * the app and the browser use the same file, the same size and the same
 * attachment headers. GitHub remains a visible fallback on the download page.
 */
export const OFFICIAL_SITE_URL = 'https://englishtok-eight.vercel.app';
export const OFFICIAL_DOWNLOAD_PAGE_URL = `${OFFICIAL_SITE_URL}/download`;
export const OFFICIAL_APK_URL = `${OFFICIAL_SITE_URL}/english-tok.apk`;

export const officialApkUrl = (version: string): string =>
  `${OFFICIAL_APK_URL}?v=${encodeURIComponent(version)}`;

export const officialDownloadPageUrl = (version: string): string =>
  `${OFFICIAL_DOWNLOAD_PAGE_URL}?source=app&version=${encodeURIComponent(version)}`;
