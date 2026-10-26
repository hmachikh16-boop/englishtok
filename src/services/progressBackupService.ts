import { APP_VERSION } from '../config/appBrand';
import type { TargetLanguage, UserProfile } from '../types';
import { validateProgressBackupProfile } from './storageService';
import { validateGameProgress, type GameProgress } from './gameProgressService';

export const ENCRYPTED_PROGRESS_BACKUP_FORMAT = 'lin-go-progress-backup';
export const ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION = 1;

const PAYLOAD_FORMAT = 'lin-go-progress-payload';
const LEGACY_BACKUP_FORMAT = 'englishtok-progress-backup';
const PRE_IMPORT_SNAPSHOT_KEY = 'lin_go_preimport_snapshot_v1';
const KDF_ITERATIONS = 210_000;
const MIN_KDF_ITERATIONS = 100_000;
const MAX_KDF_ITERATIONS = 1_000_000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 1024;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAX_BACKUP_CONTENT_CHARS = 4_000_000;
const MAX_CIPHERTEXT_BYTES = 2_500_000;
const MAX_PLAINTEXT_BYTES = 2_500_000;
const MAX_APP_VERSION_LENGTH = 50;

export type ProgressBackupErrorCode =
  | 'CRYPTO_UNAVAILABLE'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_REQUIRED'
  | 'INVALID_JSON'
  | 'INVALID_FORMAT'
  | 'LEGACY_FORMAT'
  | 'UNSUPPORTED_VERSION'
  | 'INVALID_ENCRYPTION'
  | 'INVALID_PROFILE'
  | 'INVALID_GAME_PROGRESS'
  | 'AUTHENTICATION_FAILED'
  | 'CORRUPTED_PAYLOAD'
  | 'STORAGE_UNAVAILABLE'
  | 'SNAPSHOT_FAILED'
  | 'UNKNOWN';

export class ProgressBackupError extends Error {
  readonly code: ProgressBackupErrorCode;

  constructor(code: ProgressBackupErrorCode, message: string) {
    super(message);
    this.name = 'ProgressBackupError';
    this.code = code;
  }
}

export interface ProgressBackupEncryption {
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string;
  iv: string;
}

export interface EncryptedProgressBackupEnvelope {
  format: typeof ENCRYPTED_PROGRESS_BACKUP_FORMAT;
  schemaVersion: typeof ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION;
  createdAt: string;
  appVersion: string;
  encryption: ProgressBackupEncryption;
  ciphertext: string;
}

export interface ProgressBackupMetadata {
  schemaVersion: typeof ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION;
  createdAt: string;
  appVersion: string;
  iterations: number;
  ciphertextBytes: number;
}

export interface CreatedEncryptedProgressBackup {
  fileName: string;
  contents: string;
  metadata: ProgressBackupMetadata;
}

export interface DecryptedProgressBackup {
  metadata: ProgressBackupMetadata;
  profile: UserProfile;
  gameProgress: GameProgress;
}

interface ProgressBackupPayload {
  format: typeof PAYLOAD_FORMAT;
  schemaVersion: 1;
  exportedAt: string;
  appVersion: string;
  profile: UserProfile;
  gameProgress: GameProgress;
}

export interface PreImportSnapshot {
  schemaVersion: 1;
  createdAt: string;
  sourceCreatedAt?: string;
  profile: UserProfile;
  gameProgress: GameProgress;
}

export interface ProgressSummary {
  targetLanguage?: TargetLanguage;
  displayName: string;
  xp: number;
  streakDays: number;
  activeCompletedLessons: number;
  totalCompletedLessons: number;
  savedWords: number;
  quizResults: number;
  examResults: number;
  passedExamStages: number;
  gameSolved: number;
  gameBestStreak: number;
  currentStage: number;
  languageProgressCount: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cryptoApi = (): Crypto => {
  const value = globalThis.crypto;
  if (!value?.subtle || typeof value.getRandomValues !== 'function') {
    throw new ProgressBackupError(
      'CRYPTO_UNAVAILABLE',
      'التشفير الآمن غير متاح في هذه النسخة من المتصفح أو WebView. حدّث التطبيق أو نظام الجهاز ثم أعد المحاولة.',
    );
  }
  return value;
};

export const isProgressBackupCryptoAvailable = (): boolean => {
  try {
    cryptoApi();
    return true;
  } catch {
    return false;
  }
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const base64ToBytes = (value: unknown, label: string): Uint8Array => {
  if (typeof value !== 'string' || value.length > MAX_BACKUP_CONTENT_CHARS) {
    throw new ProgressBackupError('INVALID_FORMAT', `حقل ${label} في النسخة الاحتياطية غير صالح.`);
  }
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new ProgressBackupError('INVALID_FORMAT', `حقل ${label} في النسخة الاحتياطية تالف.`);
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const aadFor = (createdAt: string): Uint8Array =>
  encoder.encode(
    `${ENCRYPTED_PROGRESS_BACKUP_FORMAT}|${ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION}|${createdAt}`,
  );

/**
 * TypeScript 7 distinguishes ArrayBuffer from SharedArrayBuffer. Web Crypto's
 * BufferSource expects the former, so copy our small input buffers explicitly.
 */
const asArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

const deriveKey = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> => {
  const subtle = cryptoApi().subtle;
  const material = await subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: asArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

const assertExportPassword = (password: string): void => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new ProgressBackupError(
      'WEAK_PASSWORD',
      `استخدم كلمة مرور مؤقتة من ${MIN_PASSWORD_LENGTH} أحرف على الأقل، ويُفضّل 12 حرفًا أو أكثر.`,
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new ProgressBackupError(
      'WEAK_PASSWORD',
      `كلمة المرور طويلة جدًا. استخدم ${MAX_PASSWORD_LENGTH} حرفًا كحد أقصى.`,
    );
  }
};

const assertImportPassword = (password: string): void => {
  if (typeof password !== 'string' || password.length === 0) {
    throw new ProgressBackupError('PASSWORD_REQUIRED', 'أدخل كلمة المرور التي استخدمتها عند إنشاء النسخة.');
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new ProgressBackupError('PASSWORD_REQUIRED', 'كلمة المرور أطول من الحد المسموح.');
  }
};

const parseEnvelope = (contents: string): EncryptedProgressBackupEnvelope => {
  if (typeof contents !== 'string' || contents.length === 0) {
    throw new ProgressBackupError('INVALID_JSON', 'لم نتمكن من قراءة الملف؛ يبدو فارغًا.');
  }
  if (contents.length > MAX_BACKUP_CONTENT_CHARS) {
    throw new ProgressBackupError('INVALID_FORMAT', 'حجم ملف النسخة الاحتياطية أكبر من الحد المسموح.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new ProgressBackupError('INVALID_JSON', 'الملف ليس نسخة احتياطية صالحة؛ تعذر قراءة JSON.');
  }
  if (!isRecord(parsed)) {
    throw new ProgressBackupError('INVALID_FORMAT', 'بنية ملف النسخة الاحتياطية غير صالحة.');
  }
  if (parsed.format === LEGACY_BACKUP_FORMAT) {
    throw new ProgressBackupError(
      'LEGACY_FORMAT',
      'هذا ملف من النسخة القديمة غير المشفرة. استخدم قسم «النسخ القديمة بالرمز» في الأسفل، أو أنشئ نسخة مشفرة جديدة من هذا الجهاز.',
    );
  }
  if (parsed.format !== ENCRYPTED_PROGRESS_BACKUP_FORMAT) {
    throw new ProgressBackupError('INVALID_FORMAT', 'هذا الملف لا يحمل تنسيق نسخة Lin Go المشفرة.');
  }
  if (parsed.schemaVersion !== ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION) {
    if (typeof parsed.schemaVersion === 'number') {
      throw new ProgressBackupError(
        'UNSUPPORTED_VERSION',
        'إصدار ملف النسخة الاحتياطية غير مدعوم في هذا الإصدار من التطبيق. حدّث التطبيق ثم حاول مجددًا.',
      );
    }
    throw new ProgressBackupError('INVALID_FORMAT', 'إصدار ملف النسخة الاحتياطية غير صالح.');
  }
  if (typeof parsed.createdAt !== 'string' || !Number.isFinite(Date.parse(parsed.createdAt))) {
    throw new ProgressBackupError('INVALID_FORMAT', 'تاريخ إنشاء النسخة الاحتياطية غير صالح.');
  }
  if (
    typeof parsed.appVersion !== 'string' ||
    parsed.appVersion.length === 0 ||
    parsed.appVersion.length > MAX_APP_VERSION_LENGTH
  ) {
    throw new ProgressBackupError('INVALID_FORMAT', 'إصدار التطبيق داخل النسخة الاحتياطية غير صالح.');
  }
  if (!isRecord(parsed.encryption)) {
    throw new ProgressBackupError('INVALID_ENCRYPTION', 'بيانات التشفير في النسخة الاحتياطية مفقودة.');
  }

  const encryption = parsed.encryption;
  if (
    encryption.algorithm !== 'AES-GCM' ||
    encryption.kdf !== 'PBKDF2' ||
    encryption.hash !== 'SHA-256'
  ) {
    throw new ProgressBackupError('INVALID_ENCRYPTION', 'نوع التشفير في النسخة الاحتياطية غير مدعوم.');
  }
  if (
    !Number.isSafeInteger(encryption.iterations) ||
    (encryption.iterations as number) < MIN_KDF_ITERATIONS ||
    (encryption.iterations as number) > MAX_KDF_ITERATIONS
  ) {
    throw new ProgressBackupError('INVALID_ENCRYPTION', 'إعدادات تقوية كلمة المرور في الملف غير صالحة.');
  }

  let salt: Uint8Array;
  let iv: Uint8Array;
  let ciphertext: Uint8Array;
  try {
    salt = base64ToBytes(encryption.salt, 'الملح');
    iv = base64ToBytes(encryption.iv, 'متجه التهيئة');
    ciphertext = base64ToBytes(parsed.ciphertext, 'النص المشفر');
  } catch (error) {
    if (error instanceof ProgressBackupError) throw error;
    throw new ProgressBackupError('INVALID_FORMAT', 'بيانات التشفير في النسخة الاحتياطية تالفة.');
  }
  if (salt.length !== SALT_BYTES || iv.length !== IV_BYTES) {
    throw new ProgressBackupError('INVALID_ENCRYPTION', 'أبعاد بيانات التشفير غير صالحة.');
  }
  if (ciphertext.length === 0 || ciphertext.length > MAX_CIPHERTEXT_BYTES) {
    throw new ProgressBackupError('INVALID_FORMAT', 'حجم النص المشفر في النسخة الاحتياطية غير صالح.');
  }

  return {
    format: ENCRYPTED_PROGRESS_BACKUP_FORMAT,
    schemaVersion: ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION,
    createdAt: parsed.createdAt,
    appVersion: parsed.appVersion,
    encryption: {
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      hash: 'SHA-256',
      iterations: encryption.iterations as number,
      salt: encryption.salt as string,
      iv: encryption.iv as string,
    },
    ciphertext: parsed.ciphertext as string,
  };
};

const metadataFromEnvelope = (envelope: EncryptedProgressBackupEnvelope): ProgressBackupMetadata => ({
  schemaVersion: ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION,
  createdAt: envelope.createdAt,
  appVersion: envelope.appVersion,
  iterations: envelope.encryption.iterations,
  ciphertextBytes: base64ToBytes(envelope.ciphertext, 'النص المشفر').length,
});

const backupFileName = (createdAt: string): string => {
  const stamp = createdAt
    .slice(0, 16)
    .replace('T', '-')
    .replace(':', '');
  return `lin-go-progress-${stamp}.json`;
};

/**
 * Inspect the unencrypted envelope only. This verifies the file type, format
 * version and crypto parameters before asking for a password. Integrity of the
 * progress itself is checked by AES-GCM during decryption.
 */
export const inspectProgressBackup = (contents: string): ProgressBackupMetadata => {
  const envelope = parseEnvelope(contents);
  return metadataFromEnvelope(envelope);
};

export const createEncryptedProgressBackup = async (
  profile: UserProfile,
  gameProgress: GameProgress,
  password: string,
  appVersion = APP_VERSION,
): Promise<CreatedEncryptedProgressBackup> => {
  if (!isRecord(profile)) {
    throw new ProgressBackupError('INVALID_PROFILE', 'تعذر قراءة تقدمك الحالي لإنشاء النسخة الاحتياطية.');
  }
  assertExportPassword(password);
  const safeProfile = validateProgressBackupProfile(profile);
  if (!safeProfile) {
    throw new ProgressBackupError('INVALID_PROFILE', 'بيانات التقدم الحالية غير صالحة لإنشاء نسخة احتياطية.');
  }
  const safeGameProgress = validateGameProgress(gameProgress);
  if (!safeGameProgress) {
    throw new ProgressBackupError('INVALID_GAME_PROGRESS', 'بيانات إنجازات الألعاب الحالية غير صالحة لإنشاء نسخة احتياطية.');
  }

  const createdAt = new Date().toISOString();
  const exportedAt = createdAt;
  const payload: ProgressBackupPayload = {
    format: PAYLOAD_FORMAT,
    schemaVersion: 1,
    exportedAt,
    appVersion,
    profile: safeProfile,
    gameProgress: safeGameProgress,
  };
  const plaintext = encoder.encode(JSON.stringify(payload));
  if (plaintext.length > MAX_PLAINTEXT_BYTES) {
    throw new ProgressBackupError(
      'INVALID_PROFILE',
      'بيانات التقدم أكبر من الحد المسموح للنسخة الاحتياطية. قلّل حجم صورة الملف الشخصي ثم حاول مجددًا.',
    );
  }

  const api = cryptoApi();
  const salt = api.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = api.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, KDF_ITERATIONS);
  const encrypted = new Uint8Array(
    await api.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: asArrayBuffer(iv),
        additionalData: asArrayBuffer(aadFor(createdAt)),
        tagLength: 128,
      },
      key,
      asArrayBuffer(plaintext),
    ),
  );

  const envelope: EncryptedProgressBackupEnvelope = {
    format: ENCRYPTED_PROGRESS_BACKUP_FORMAT,
    schemaVersion: ENCRYPTED_PROGRESS_BACKUP_SCHEMA_VERSION,
    createdAt,
    appVersion,
    encryption: {
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      hash: 'SHA-256',
      iterations: KDF_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(encrypted),
  };

  return {
    fileName: backupFileName(createdAt),
    contents: JSON.stringify(envelope, null, 2),
    metadata: metadataFromEnvelope(envelope),
  };
};

export const decryptProgressBackup = async (
  contents: string,
  password: string,
): Promise<DecryptedProgressBackup> => {
  const envelope = parseEnvelope(contents);
  assertImportPassword(password);

  const api = cryptoApi();
  const salt = base64ToBytes(envelope.encryption.salt, 'الملح');
  const iv = base64ToBytes(envelope.encryption.iv, 'متجه التهيئة');
  const ciphertext = base64ToBytes(envelope.ciphertext, 'النص المشفر');
  const key = await deriveKey(password, salt, envelope.encryption.iterations);

  let plaintext: Uint8Array;
  try {
    plaintext = new Uint8Array(
      await api.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: asArrayBuffer(iv),
          additionalData: asArrayBuffer(aadFor(envelope.createdAt)),
          tagLength: 128,
        },
        key,
        asArrayBuffer(ciphertext),
      ),
    );
  } catch {
    // AES-GCM intentionally cannot distinguish a wrong password from tampered
    // ciphertext, so the message must cover both possibilities.
    throw new ProgressBackupError(
      'AUTHENTICATION_FAILED',
      'كلمة المرور غير صحيحة، أو أن الملف تالف أو تم تعديله. لم يتم تغيير تقدمك الحالي.',
    );
  }

  if (plaintext.length > MAX_PLAINTEXT_BYTES) {
    throw new ProgressBackupError('CORRUPTED_PAYLOAD', 'محتوى النسخة الاحتياطية أكبر من الحد المسموح.');
  }

  let payloadValue: unknown;
  try {
    payloadValue = JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new ProgressBackupError('CORRUPTED_PAYLOAD', 'محتوى النسخة الاحتياطية تالف.');
  }
  if (!isRecord(payloadValue)) {
    throw new ProgressBackupError('CORRUPTED_PAYLOAD', 'بنية محتوى النسخة الاحتياطية غير صالحة.');
  }
  if (payloadValue.format !== PAYLOAD_FORMAT || payloadValue.schemaVersion !== 1) {
    throw new ProgressBackupError('UNSUPPORTED_VERSION', 'إصدار محتوى النسخة الاحتياطية غير مدعوم.');
  }
  if (
    typeof payloadValue.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(payloadValue.exportedAt)) ||
    typeof payloadValue.appVersion !== 'string' ||
    payloadValue.appVersion.length > MAX_APP_VERSION_LENGTH
  ) {
    throw new ProgressBackupError('CORRUPTED_PAYLOAD', 'بيانات تاريخ النسخة الاحتياطية غير صالحة.');
  }

  const profile = validateProgressBackupProfile(payloadValue.profile);
  if (!profile) {
    throw new ProgressBackupError('INVALID_PROFILE', 'بيانات التقدم داخل النسخة الاحتياطية غير صالحة.');
  }
  const gameProgress = validateGameProgress(payloadValue.gameProgress);
  if (!gameProgress) {
    throw new ProgressBackupError('INVALID_GAME_PROGRESS', 'بيانات إنجازات الألعاب داخل النسخة الاحتياطية غير صالحة.');
  }

  return {
    metadata: metadataFromEnvelope(envelope),
    profile,
    gameProgress,
  };
};

export const summarizeProgress = (
  profile: UserProfile,
  gameProgress: GameProgress,
): ProgressSummary => {
  const languageSnapshots = Object.values(profile.languageProgress ?? {});
  const allCompleted = new Set<string>(profile.completedLessonIds);
  for (const snapshot of languageSnapshots) {
    for (const lessonId of snapshot.completedLessonIds) allCompleted.add(lessonId);
  }

  const passedStages = Object.entries(profile.levelExamResults ?? {})
    .filter(([, result]) => result.passed === true)
    .map(([stage]) => Number(stage))
    .filter((stage) => Number.isSafeInteger(stage) && stage > 0);
  const suggestedStage = profile.placementAssessment?.result?.suggestedStage ?? 1;
  const highestPassedStage = passedStages.length > 0 ? Math.max(...passedStages) : 0;
  const currentStage = Math.min(10, Math.max(1, suggestedStage, highestPassedStage + 1));

  return {
    targetLanguage: profile.targetLanguage,
    displayName: profile.displayName?.trim() || 'متعلّم Lin Go',
    xp: profile.xp,
    streakDays: profile.streakDays,
    activeCompletedLessons: profile.completedLessonIds.length,
    totalCompletedLessons: allCompleted.size,
    savedWords: profile.savedWordIds.length,
    quizResults: Object.keys(profile.quizScores ?? {}).length,
    examResults: Object.keys(profile.levelExamResults ?? {}).length,
    passedExamStages: passedStages.length,
    gameSolved: gameProgress.totalSolved,
    gameBestStreak: gameProgress.bestStreak,
    currentStage,
    languageProgressCount: Object.keys(profile.languageProgress ?? {}).length,
  };
};

/**
 * Store the current progress locally before an import replaces it. This is
 * deliberately a separate key from the active profile: if the import or the
 * following write fails, the learner's previous state remains recoverable.
 */
export const savePreImportSnapshot = (
  profile: UserProfile,
  gameProgress: GameProgress,
  sourceCreatedAt?: string,
): PreImportSnapshot => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new ProgressBackupError('STORAGE_UNAVAILABLE', 'تعذر الوصول إلى التخزين المحلي لإنشاء نسخة الأمان.');
  }
  const safeProfile = validateProgressBackupProfile(profile);
  if (!safeProfile) {
    throw new ProgressBackupError('INVALID_PROFILE', 'تعذر إنشاء نسخة الأمان لأن تقدمك الحالي غير صالح.');
  }
  const safeGameProgress = validateGameProgress(gameProgress);
  if (!safeGameProgress) {
    throw new ProgressBackupError('INVALID_GAME_PROGRESS', 'تعذر إنشاء نسخة الأمان لأن بيانات الألعاب الحالية غير صالحة.');
  }

  const snapshot: PreImportSnapshot = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    ...(sourceCreatedAt && Number.isFinite(Date.parse(sourceCreatedAt))
      ? { sourceCreatedAt }
      : {}),
    profile: safeProfile,
    gameProgress: safeGameProgress,
  };
  try {
    window.localStorage.setItem(PRE_IMPORT_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    throw new ProgressBackupError(
      'SNAPSHOT_FAILED',
      'لا توجد مساحة محلية كافية لحفظ نسخة الأمان قبل الاستيراد. لم يتم تغيير تقدمك. أفرغ بعض مساحة التخزين ثم حاول مجددًا.',
    );
  }
  return snapshot;
};

export const getPreImportSnapshot = (): PreImportSnapshot | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PRE_IMPORT_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schemaVersion !== 1) return null;
    if (typeof parsed.createdAt !== 'string' || !Number.isFinite(Date.parse(parsed.createdAt))) return null;
    const profile = validateProgressBackupProfile(parsed.profile);
    const gameProgress = validateGameProgress(parsed.gameProgress);
    if (!profile || !gameProgress) return null;
    return {
      schemaVersion: 1,
      createdAt: parsed.createdAt,
      ...(typeof parsed.sourceCreatedAt === 'string' && Number.isFinite(Date.parse(parsed.sourceCreatedAt))
        ? { sourceCreatedAt: parsed.sourceCreatedAt }
        : {}),
      profile,
      gameProgress,
    };
  } catch {
    return null;
  }
};

export const clearPreImportSnapshot = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PRE_IMPORT_SNAPSHOT_KEY);
  } catch {
    // The snapshot is a safety copy; a restricted storage should not block restore.
  }
};

export const asProgressBackupError = (error: unknown): ProgressBackupError => {
  if (error instanceof ProgressBackupError) return error;
  return new ProgressBackupError(
    'UNKNOWN',
    error instanceof Error && error.message.trim()
      ? error.message
      : 'تعذر إكمال عملية النسخة الاحتياطية.',
  );
};
