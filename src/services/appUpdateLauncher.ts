import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppUpdateManifest } from './appUpdateService';

interface NativeDownloadStatus {
  status: 'pending' | 'running' | 'paused' | 'successful' | 'failed' | 'unknown';
  bytesDownloaded: number;
  totalBytes: number;
  reason?: number;
}

interface AppUpdateInstallerPlugin {
  downloadUpdate(options: {
    url: string;
    fileName: string;
    expectedSha256: string;
  }): Promise<{ downloadId: number | string }>;
  getDownloadStatus(options: { downloadId: string }): Promise<NativeDownloadStatus>;
  installUpdate(options: {
    fileName: string;
    expectedSha256: string;
  }): Promise<{ started: boolean }>;
  openInstallSettings(): Promise<void>;
  cancelDownload(options: { downloadId: string }): Promise<void>;
}

const AppUpdateInstaller = registerPlugin<AppUpdateInstallerPlugin>('AppUpdateInstaller');

const DOWNLOAD_TIMEOUT_MS = 20 * 60 * 1000;
const STATUS_POLL_MS = 800;
const UNKNOWN_STATUS_TIMEOUT_MS = 25 * 1000;

export interface AppUpdateProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const safeBytes = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeUpdateError = (error: unknown): Error => {
  if (isRecord(error)) {
    if (error.code === 'INSTALL_PERMISSION_REQUIRED') {
      return new Error(
        'اسمح لـ Lin Go بتثبيت التطبيقات من إعدادات Android، ثم اضغط «تنزيل التحديث» مرة أخرى. لن يثبّت التطبيق أي ملف دون موافقتك.',
      );
    }
    if (error.code === 'CHECKSUM_MISMATCH' || error.code === 'INVALID_CHECKSUM') {
      return new Error('ملف التحديث لا يطابق البصمة المنشورة؛ أُلغي التثبيت لحمايتك.');
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return new Error(error.message);
    }
  }
  if (error instanceof Error && error.message.trim()) return new Error(error.message);
  return new Error('تعذر تنزيل التحديث. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
};

const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/**
 * Downloads the signed APK inside the app and hands it to Android's package
 * installer. Android still asks the learner to confirm every installation.
 *
 * The web build keeps the browser download path because it has no access to
 * Android's DownloadManager or package installer.
 */
export const downloadAndInstallAppUpdate = async (
  update: AppUpdateManifest,
  onProgress?: (progress: AppUpdateProgress) => void,
): Promise<void> => {
  if (!update.apkUrl.startsWith('https://github.com/')) {
    throw new Error('رابط التحديث غير موثوق.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(update.version)) {
    throw new Error('رقم إصدار التحديث غير صالح.');
  }
  if (!/^[a-f\d]{64}$/i.test(update.sha256)) {
    throw new Error('بصمة التحديث المنشورة غير صالحة، لذلك لن يبدأ التنزيل.');
  }

  if (!isNativeAndroid()) {
    if (typeof window === 'undefined') {
      throw new Error('تنزيل التحديث غير متاح في هذه البيئة.');
    }
    window.open(update.apkUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const fileName = `english-tok-${update.version}.apk`;
  let downloadId: string | null = null;
  const startedAt = Date.now();
  let unknownSince: number | null = null;

  try {
    const download = await AppUpdateInstaller.downloadUpdate({
      url: update.apkUrl,
      fileName,
      expectedSha256: update.sha256.toLowerCase(),
    });
    const numericDownloadId = Number(download.downloadId);
    if (!Number.isSafeInteger(numericDownloadId) || numericDownloadId <= 0) {
      throw new Error('تعذر بدء التنزيل: لم يُرجع Android معرّف تنزيل صالحًا.');
    }
    // Send the id as a string so the native bridge never turns it into a
    // small Integer that Capacitor's getLong() cannot read back.
    downloadId = String(numericDownloadId);
    onProgress?.({ bytesDownloaded: 0, totalBytes: 0, percent: 0 });

    while (Date.now() - startedAt < DOWNLOAD_TIMEOUT_MS) {
      const status = await AppUpdateInstaller.getDownloadStatus({ downloadId });
      const totalBytes = safeBytes(status.totalBytes);
      const bytesDownloaded = safeBytes(status.bytesDownloaded);

      if (status.status === 'unknown') {
        unknownSince ??= Date.now();
        if (Date.now() - unknownSince > UNKNOWN_STATUS_TIMEOUT_MS) {
          throw new Error('تعذر العثور على التنزيل في مدير التنزيلات. أعد المحاولة.');
        }
      } else {
        unknownSince = null;
      }

      onProgress?.({
        bytesDownloaded,
        totalBytes,
        percent: totalBytes > 0
          ? Math.min(100, Math.round((bytesDownloaded / totalBytes) * 100))
          : 0,
      });

      if (status.status === 'successful') {
        await AppUpdateInstaller.installUpdate({
          fileName,
          expectedSha256: update.sha256.toLowerCase(),
        });
        return;
      }
      if (status.status === 'failed') {
        throw new Error(
          typeof status.reason === 'number'
            ? `فشل تنزيل التحديث من GitHub (السبب ${status.reason}). حاول مرة أخرى.`
            : 'فشل تنزيل التحديث من GitHub. حاول مرة أخرى.',
        );
      }

      await delay(STATUS_POLL_MS);
    }

    throw new Error('استغرق تنزيل التحديث وقتًا طويلًا. تحقق من الاتصال ثم حاول مرة أخرى.');
  } catch (error) {
    if (downloadId !== null) {
      try {
        await AppUpdateInstaller.cancelDownload({ downloadId });
      } catch {
        // The download may have already finished or been removed by Android.
      }
    }
    throw normalizeUpdateError(error);
  }
};
