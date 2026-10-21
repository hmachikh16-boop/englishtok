import { Capacitor } from '@capacitor/core';

/**
 * The web build can use same-origin API routes. The Android app is served from
 * Capacitor's local origin, so its API calls must target the deployed Vercel
 * function explicitly. VITE_API_BASE_URL can override the default for a custom
 * deployment or for local testing on a device.
 */
const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';

const defaultNativeBaseUrl = 'https://englishtok-eight.vercel.app';

export const getApiBaseUrl = (): string => {
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');
  return Capacitor.getPlatform() === 'android' ? defaultNativeBaseUrl : '';
};

export const apiUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};
