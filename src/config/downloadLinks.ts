import { IS_GOLD_EDITION } from './edition';

/**
 * Public download endpoints. Keep every update route on the official site so
 * the app and the browser use the same file, the same size and the same
 * attachment headers. GitHub remains a visible fallback on the download page.
 *
 * Free and Gold have separate first-party APK paths. This is what makes the
 * in-app updater safe: Gold can never receive the Free package (and Free can
 * never receive a Gold package) even though both editions share the same code.
 */
export const OFFICIAL_SITE_URL = 'https://englishtok-eight.vercel.app';
export const OFFICIAL_DOWNLOAD_PAGE_URL = `${OFFICIAL_SITE_URL}/download`;
export const OFFICIAL_APK_URL = `${OFFICIAL_SITE_URL}/english-tok.apk`;
export const OFFICIAL_GOLD_APK_URL = `${OFFICIAL_SITE_URL}/lin-go-gold-1.1.14.apk`;

export const officialApkUrl = (version: string): string => {
  if (IS_GOLD_EDITION) {
    return `${OFFICIAL_SITE_URL}/lin-go-gold-${encodeURIComponent(version)}.apk`;
  }
  return `${OFFICIAL_APK_URL}?v=${encodeURIComponent(version)}`;
};

export const officialDownloadPageUrl = (version: string): string =>
  `${OFFICIAL_DOWNLOAD_PAGE_URL}?source=app&version=${encodeURIComponent(version)}${
    IS_GOLD_EDITION ? '&edition=gold' : ''
  }`;
