import { Capacitor, registerPlugin } from '@capacitor/core';
import { officialApkUrl } from '../config/downloadLinks';
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

const assertUpdate = (update: AppUpdateManifest): void => {
  if (!/^\d+\.\d+\.\d+$/.test(update.version)) {
    throw new Error('رقم إصدار التحديث غير صالح.');
  }
  if (!/^[a-f\d]{64}$/i.test(update.sha256)) {
    throw new Error('بصمة التحديث المنشورة غير صالحة، لذلك لن يبدأ التنزيل.');
  }
};

/**
 * Starts the official APK download through Android's DownloadManager.
 *
 * DownloadManager keeps the transfer outside the WebView, shows a system
 * notification and saves the finished file in the public Downloads folder.
 * It does not need the package-installer permission. Older Android versions
 * do not allow writing to the public Downloads folder this way, so they fall
 * back to the browser download.
 */
export const downloadAppUpdate = async (
  update: AppUpdateManifest,
): Promise<AppUpdateDownloadResult> => {
  assertUpdate(update);
  const fileName = `lin-go-${update.version}.apk`;

  if (isAndroidNative()) {
    try {
      const result = await ApkDownloader.download({
        url: officialApkUrl(update.version),
        fileName,
        title: `Lin Go ${update.version}`,
      });
      return {
        mode: 'app',
        fileName: result.fileName || fileName,
        location: result.location || `Downloads/${fileName}`,
      };
    } catch (error) {
      console.warn(
        'The in-app downloader is unavailable; opening the browser download instead.',
        error,
      );
    }
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
