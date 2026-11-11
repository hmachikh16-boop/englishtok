import { getStoredGoldLicenseCode } from './goldLicense';

export const FRIEND_ID_KEY = 'lin-go-friend-id-v1';

export const normalizeFriendCode = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, '');

const createLocalId = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `U-${out}`;
};

/**
 * A stable, non-reversible friend code derived from the licence. It never
 * exposes the licence itself, so sharing it can't be used to activate Gold on
 * another phone or trip the device-limit anti-cheat.
 */
const hashToFriendCode = (input: string): string => {
  let forward = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    forward ^= input.charCodeAt(i);
    forward = Math.imul(forward, 0x01000193) >>> 0;
  }
  let backward = 0x811c9dc5;
  for (let i = input.length - 1; i >= 0; i -= 1) {
    backward ^= input.charCodeAt(i);
    backward = Math.imul(backward, 0x01000193) >>> 0;
  }
  const body = (forward.toString(36) + backward.toString(36))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
    .padEnd(8, '0');
  return `U-${body}`;
};

/** A stable friend identity: derived from the licence when present, otherwise a per-device ID. */
export const readFriendIdentity = (): string => {
  const license = normalizeFriendCode(getStoredGoldLicenseCode() || '');
  if (license) return hashToFriendCode(license);
  try {
    const stored = localStorage.getItem(FRIEND_ID_KEY);
    if (stored && /^U-[A-Z0-9]{6,12}$/.test(stored)) return stored;
    const created = createLocalId();
    localStorage.setItem(FRIEND_ID_KEY, created);
    return created;
  } catch {
    return createLocalId();
  }
};
