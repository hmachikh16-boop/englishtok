import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
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
 * Opens the official APK download in the system browser instead of downloading
 * and installing it from inside the app.
 *
 * This is deliberate. Android treats an app that downloads and installs APKs
 * as a package installer/dropper, and Google Play Protect can block it as
 * harmful. Keeping the installer permission and native installer code out of
 * Lin Go makes the app safer and avoids that false-positive path. The learner
 * still confirms installation in Android's own package installer.
 */
export const openAppUpdateDownload = async (
  update: AppUpdateManifest,
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

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: update.apkUrl });
      return;
    }
    if (typeof window === 'undefined') {
      throw new Error('تنزيل التحديث غير متاح في هذه البيئة.');
    }
    window.open(update.apkUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    throw normalizeOpenError(error);
  }
};
