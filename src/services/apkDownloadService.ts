import { Capacitor, registerPlugin } from '@capacitor/core';
import { officialApkUrl } from '../config/downloadLinks';
import { IS_GOLD_EDITION } from '../config/edition';
import { openAppUpdateDownload } from './appUpdateLauncher';
import type { AppUpdateManifest } from './appUpdateService';

interface NativeApkDownloadResult {
  id: number;
  fileName: string;
  location: string;
}

interface ApkDownloaderPlugin {
  download(options: {
    url: string;
    fileName: string;
    title: string;
  }): Promise<NativeApkDownloadResult>;
  openDownloads(): Promise<void>;
}

const ApkDownloader = registerPlugin<ApkDownloaderPlugin>('ApkDownloader');

export type AppUpdateDownloadResult =
  | { mode: 'app'; fileName: string; location: string }
  | { mode: 'browser' };

const isAndroidNative = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const expectedPackageId = IS_GOLD_EDITION ? 'com.englishtok.gold' : 'com.englishtok.app';

const assertUpdate = (update: AppUpdateManifest): void => {
  if (!/^\d+\.\d+\.\d+$/.test(update.version)) {
    throw new Error('رقم إصدار التحديث غير صالح.');
  }
  if (update.packageId !== expectedPackageId) {
    throw new Error('حزمة التحديث لا تخص هذه النسخة من التطبيق.');
  }
  if (!/^[a-f\d]{64}$/i.test(update.sha256)) {
    throw new Error('بصمة التحديث المنشورة غير صالحة، لذلك لن يبدأ التنزيل.');
  }
};

const normalizeDownloadError = (error: unknown): Error => {
  if (error instanceof Error && error.message.trim()) return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.trim()
  ) {
    return new Error((error as { message: string }).message);
  }
  return new Error('تعذر بدء التنزيل داخل التطبيق. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
};

/**
 * Starts the official APK download through Android's DownloadManager.
 *
 * DownloadManager keeps the transfer outside the WebView, shows a system
 * notification and saves the finished file without the package-installer
 * permission. Installation remains a user action from the notification.
 *
 * Gold must never leave the app for an update: if the native downloader is
 * unavailable it raises an error instead of opening a browser. Free keeps the
 * browser fallback for older devices or unusual WebViews.
 */
export const downloadAppUpdate = async (
  update: AppUpdateManifest,
): Promise<AppUpdateDownloadResult> => {
  assertUpdate(update);
  const fileName = IS_GOLD_EDITION
    ? `lin-go-gold-${update.version}.apk`
    : `lin-go-${update.version}.apk`;
  const title = IS_GOLD_EDITION ? `Lin Go Gold ${update.version}` : `Lin Go ${update.version}`;

  if (isAndroidNative()) {
    try {
      const result = await ApkDownloader.download({
        url: officialApkUrl(update.version),
        fileName,
        title,
      });
      return {
        mode: 'app',
        fileName: result.fileName || fileName,
        location: result.location || `Downloads/${fileName}`,
      };
    } catch (error) {
      if (IS_GOLD_EDITION) {
        console.error('The Gold in-app downloader failed; the browser is not used for Gold.', error);
        throw normalizeDownloadError(error);
      }
      console.warn(
        'The in-app downloader is unavailable; opening the browser download instead.',
        error,
      );
    }
  }

  if (IS_GOLD_EDITION) {
    throw new Error('تحديث Gold يتم من داخل تطبيق Android فقط، دون فتح المتصفح.');
  }

  await openAppUpdateDownload(update);
  return { mode: 'browser' };
};

/** Opens the system Downloads screen after an in-app download starts. */
export const openDownloadsFolder = async (): Promise<boolean> => {
  if (!isAndroidNative()) return false;
  try {
    await ApkDownloader.openDownloads();
    return true;
  } catch (error) {
    console.warn('Unable to open the system Downloads screen:', error);
    return false;
  }
};
