import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { IS_GOLD_EDITION } from '../config/edition';
import { officialApkUrl } from '../config/downloadLinks';
import type { AppUpdateManifest } from './appUpdateService';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeOpenError = (error: unknown): Error => {
  if (isRecord(error) && typeof error.message === 'string' && error.message.trim()) {
    return new Error(error.message);
  }
  if (error instanceof Error && error.message.trim()) return new Error(error.message);
  return new Error('تعذر فتح رابط التحديث. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
};

/**
 * Opens the official, first-party APK download in the system browser.
 *
 * The app itself never installs packages and never requests the package
 * installer permission. The browser path is retained as a fallback beside the
 * in-app DownloadManager path, so both routes deliver the exact same file and
 * the same versioned filename.
 */
export const openAppUpdateDownload = async (
  update: AppUpdateManifest,
): Promise<void> => {
  if (IS_GOLD_EDITION) {
    throw new Error('تحديث Gold+ يتم داخل التطبيق نفسه عبر مدير التنزيلات، دون فتح المتصفح.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(update.version)) {
    throw new Error('رقم إصدار التحديث غير صالح.');
  }
  if (!/^[a-f\d]{64}$/i.test(update.sha256)) {
    throw new Error('بصمة التحديث المنشورة غير صالحة، لذلك لن يبدأ التنزيل.');
  }

  const url = officialApkUrl(update.version);
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
    if (typeof window === 'undefined') {
      throw new Error('تنزيل التحديث غير متاح في هذه البيئة.');
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lin-go-${update.version}.apk`;
    anchor.rel = 'noopener noreferrer';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    throw normalizeOpenError(error);
  }
};
