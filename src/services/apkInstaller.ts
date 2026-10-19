import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppUpdateManifest } from './appUpdateService';

export interface ApkDownloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface ApkDownloadResult {
  filePath: string;
  fileName: string;
  size: number;
  sha256: string;
}

interface ApkUpdaterPlugin {
  download(options: { url: string; fileName?: string }): Promise<ApkDownloadResult>;
  install(options: { filePath: string }): Promise<void>;
  addListener(
    eventName: 'downloadProgress',
    listener: (data: ApkDownloadProgress) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

const ApkUpdater = registerPlugin<ApkUpdaterPlugin>('ApkUpdater');

/** The in-app downloader and package installer only exist in the Android build. */
export const canInstallApkInApp = (): boolean => Capacitor.getPlatform() === 'android';

/**
 * Downloads the published APK inside the app — reporting real progress — and
 * then hands the finished file to the Android package installer.
 *
 * The old flow opened the release URL in a Custom Tab, so the browser owned the
 * download and stopped at 100%, waiting for a tap on its own notification.
 */
export const downloadAndInstallAppUpdate = async (
  update: AppUpdateManifest,
  onProgress?: (percent: number) => void,
): Promise<void> => {
  if (!canInstallApkInApp()) {
    throw new Error('تثبيت التحديث متاح من داخل تطبيق Android فقط.');
  }

  const listener = onProgress
    ? await ApkUpdater.addListener('downloadProgress', (data) => {
        if (data && typeof data.percent === 'number' && data.percent >= 0) {
          onProgress(Math.min(100, data.percent));
        }
      })
    : null;

  try {
    const result = await ApkUpdater.download({
      url: update.apkUrl,
      fileName: `english-tok-${update.version}.apk`,
    });

    const expected = update.sha256?.toLowerCase();
    if (expected && result.sha256 && result.sha256.toLowerCase() !== expected) {
      throw new Error('الملف المنزّل لا يطابق الإصدار المتوقع (بصمة SHA-256 مختلفة).');
    }

    onProgress?.(100);
    await ApkUpdater.install({ filePath: result.filePath });
  } finally {
    if (listener) {
      try {
        await listener.remove();
      } catch {
        /* The listener is released with the callback scope anyway. */
      }
    }
  }
};
