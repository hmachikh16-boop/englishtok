import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import type { AppUpdateManifest } from './appUpdateService';

/**
 * Opens the official APK download in the device browser.
 *
 * EnglishTok intentionally does not request Android's REQUEST_INSTALL_PACKAGES
 * permission. Keeping the download and installation in the browser removes a
 * high-risk permission from the app, which reduces Play Protect warnings while
 * still letting Android verify the APK signature before installation.
 */
export const openAppUpdateDownload = async (update: AppUpdateManifest): Promise<void> => {
  if (!update.apkUrl.startsWith('https://github.com/')) {
    throw new Error('رابط التحديث غير موثوق.');
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: update.apkUrl });
    return;
  }

  if (typeof window === 'undefined') {
    throw new Error('فتح رابط التحديث غير متاح في هذه البيئة.');
  }
  window.open(update.apkUrl, '_blank', 'noopener,noreferrer');
};
