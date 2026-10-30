const STORAGE_KEY = 'lin-go-gold-license-code';
const CHECK_URL = 'https://www.lingo.com/api/admin?action=check';

export interface GoldLicenseResult {
  valid: boolean;
  status: string;
  plan?: string;
  duration?: string;
  expiresAt?: string | null;
  networkError?: boolean;
  error?: string;
}

export const getStoredGoldLicenseCode = (): string => {
  try {
    return (window.localStorage.getItem(STORAGE_KEY) ?? '').trim().toUpperCase();
  } catch {
    return '';
  }
};

export const storeGoldLicenseCode = (code: string): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, code.trim().toUpperCase());
  } catch {
    /* Ignore storage failures; the session still works in memory. */
  }
};

export const clearStoredGoldLicenseCode = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Ignore storage failures. */
  }
};

export const verifyGoldLicense = async (code: string): Promise<GoldLicenseResult> => {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, status: 'missing' };
  }

  try {
    const response = await fetch(`${CHECK_URL}&code=${encodeURIComponent(normalized)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        valid: false,
        status: 'error',
        error: typeof payload?.error === 'string' ? payload.error : 'تعذر التحقق من الكود.',
      };
    }

    return {
      valid: Boolean(payload?.valid),
      status: typeof payload?.status === 'string' ? payload.status : payload?.valid ? 'active' : 'invalid',
      plan: typeof payload?.plan === 'string' ? payload.plan : undefined,
      duration: typeof payload?.duration === 'string' ? payload.duration : undefined,
      expiresAt: payload?.expiresAt ?? null,
    };
  } catch (error) {
    return {
      valid: false,
      status: 'network',
      networkError: true,
      error: error instanceof Error ? error.message : 'تعذر الاتصال بلوحة التحكم.',
    };
  }
};