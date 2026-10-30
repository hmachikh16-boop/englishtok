import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/** Official Gold landing page shown from the free Lin Go app. */
export const GOLD_PAGE_URL = 'https://englishtok-eight.vercel.app/gold';

/**
 * Opens the Gold page in the system browser on Android, or in a new tab on
 * the web. Keeping this outside the app avoids turning the free APK into a
 * package downloader while still giving users a direct route to Gold.
 */
export const openGoldPage = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url: GOLD_PAGE_URL });
      return;
    } catch (error) {
      console.warn('Unable to open the Gold page in the system browser:', error);
    }
  }

  const opened = window.open(GOLD_PAGE_URL, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.assign(GOLD_PAGE_URL);
};
