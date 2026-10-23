import { UserProfile, UserSettings } from '../types';
import { normalizeSpeechLanguage } from './speechClip';

const STORAGE_KEY = 'englishtok_user_profile_v1';
const PROGRESS_BACKUPS_KEY = 'englishtok_progress_backups_v1';
const PROGRESS_BACKUP_FORMAT = 'englishtok-progress-backup';
const PROGRESS_BACKUP_SCHEMA_VERSION = 1;
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_DIGITS = '23456789';

export interface ProgressBackup {
  format: typeof PROGRESS_BACKUP_FORMAT;
  schemaVersion: typeof PROGRESS_BACKUP_SCHEMA_VERSION;
  code: string;
  createdAt: string;
  profile: UserProfile;
}

const DEFAULT_SETTINGS: UserSettings = {
  playbackSpeed: 1.0,
  subtitlesMode: 'both',
  soundEffects: true,
  autoNext: false,
  voiceLanguage: 'en',
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'متعلّم EnglishTok',
  profileTagline: 'رحلتي اليومية نحو الطلاقة',
  joinedAt: new Date().toISOString(),
  xp: 120,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  likedLessonIds: [],
  favoriteLessonIds: [],
  watchedLessonIds: [],
  completedLessonIds: [],
  savedWordIds: [],
  masteredWordIds: [],
  reviewWordIds: [],
  quizScores: {},
  levelExamResults: {},
  dailyGoalLessons: 2,
  dailyProgress: {
    date: new Date().toISOString().slice(0, 10),
    completedLessonIds: [],
  },
  settings: DEFAULT_SETTINGS,
};

export const getStoredProfile = (): UserProfile => {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw) as UserProfile;
    // Streak check
    const today = new Date().toISOString().split('T')[0];
    if (parsed.lastActiveDate !== today) {
      const lastDate = new Date(parsed.lastActiveDate);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        parsed.streakDays += 1;
      }
      parsed.lastActiveDate = today;
      saveProfile(parsed);
    }
    const joinedAt = typeof parsed.joinedAt === 'string' && Number.isFinite(Date.parse(parsed.joinedAt))
      ? parsed.joinedAt
      : new Date().toISOString();
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      ...parsed,
      joinedAt,
      ...(sanitizePlacementAssessment((parsed as UserProfile).placementAssessment)
        ? { placementAssessment: sanitizePlacementAssessment((parsed as UserProfile).placementAssessment)! }
        : { placementAssessment: undefined }),
      levelExamResults: parsed.levelExamResults ?? {},
      reviewWordIds: parsed.reviewWordIds ?? [],
      dailyGoalLessons: parsed.dailyGoalLessons ?? DEFAULT_PROFILE.dailyGoalLessons,
      dailyProgress:
        parsed.dailyProgress?.date === today
          ? parsed.dailyProgress
          : { date: today, completedLessonIds: [] },
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
    // Save the generated identity once so the join date and default name stay
    // stable for profiles created before the profile card existed.
    if (!parsed.displayName || !parsed.joinedAt) saveProfile(profile);
    return profile;
  } catch (e) {
    console.error('Failed to load EnglishTok profile:', e);
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to localStorage:', e);
  }
};

export const isValidProgressCode = (value: string): boolean => /^[A-Z]{3}\d{3}$/i.test(value.trim());

export const validateProgressBackupProfile = (value: unknown): UserProfile | null => sanitizeProfile(value);

export const saveCloudProgressBackup = async (backup: ProgressBackup): Promise<void> => {
  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: backup.code, profile: backup.profile }),
  });
  if (response.status === 409) throw new Error('هذا الرمز مستخدم بالفعل. أنشئ رمزًا جديدًا ثم حاول مجددًا.');
  if (response.status === 503) throw new Error('التخزين السحابي غير مهيأ بعد لهذا الموقع.');
  if (!response.ok) throw new Error('تعذر حفظ النسخة على الخادم. تحقق من الاتصال ثم أعد المحاولة.');
};

export const getCloudProgressBackup = async (codeInput: string): Promise<ProgressBackup | null> => {
  const code = codeInput.trim().toUpperCase();
  if (!isValidProgressCode(code)) return null;
  const response = await fetch(`/api/progress?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (response.status === 503) throw new Error('التخزين السحابي غير مهيأ بعد لهذا الموقع.');
  if (!response.ok) throw new Error('تعذر البحث عن النسخة السحابية. تحقق من الاتصال ثم أعد المحاولة.');
  const raw: unknown = await response.json();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('استجابة النسخة السحابية غير صالحة.');
  const record = raw as Record<string, unknown>;
  const profile = sanitizeProfile(record.profile);
  if (record.format !== PROGRESS_BACKUP_FORMAT || record.schemaVersion !== PROGRESS_BACKUP_SCHEMA_VERSION || record.code !== code || typeof record.createdAt !== 'string' || !profile) {
    throw new Error('بيانات النسخة السحابية لا تطابق إصدار EnglishTok.');
  }
  const backup: ProgressBackup = { format: PROGRESS_BACKUP_FORMAT, schemaVersion: PROGRESS_BACKUP_SCHEMA_VERSION, code, createdAt: record.createdAt, profile };
  writeProgressBackup(backup);
  return backup;
};

const makeProgressCode = (): string => {
  const bytes = new Uint8Array(6);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('يتطلب إنشاء الرمز مولّدًا عشوائيًا آمنًا في هذا المتصفح.');
  }
  globalThis.crypto.getRandomValues(bytes);
  return `${Array.from(bytes.slice(0, 3), (byte) => CODE_LETTERS[byte % CODE_LETTERS.length]).join('')}${Array.from(bytes.slice(3), (byte) => CODE_DIGITS[byte % CODE_DIGITS.length]).join('')}`;
};

const readProgressBackups = (): Record<string, ProgressBackup> => {
  try {
    const raw = localStorage.getItem(PROGRESS_BACKUPS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, ProgressBackup>
      : {};
  } catch {
    return {};
  }
};

const writeProgressBackup = (backup: ProgressBackup): void => {
  const backups = { ...readProgressBackups(), [backup.code]: backup };
  const recent = Object.entries(backups)
    .sort(([, left], [, right]) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 5);
  localStorage.setItem(PROGRESS_BACKUPS_KEY, JSON.stringify(Object.fromEntries(recent)));
};

export const createProgressBackup = (profile: UserProfile): ProgressBackup => {
  if (typeof window === 'undefined') throw new Error('إنشاء النسخة الاحتياطية متاح داخل التطبيق فقط.');
  const backups = readProgressBackups();
  let code = '';
  for (let attempt = 0; attempt < 16; attempt += 1) {
    code = makeProgressCode();
    if (!backups[code]) break;
    code = '';
  }
  if (!code) throw new Error('تعذر إنشاء رمز فريد. حاول مرة أخرى.');

  const backup: ProgressBackup = {
    format: PROGRESS_BACKUP_FORMAT,
    schemaVersion: PROGRESS_BACKUP_SCHEMA_VERSION,
    code,
    createdAt: new Date().toISOString(),
    profile: JSON.parse(JSON.stringify(profile)) as UserProfile,
  };
  writeProgressBackup(backup);
  return backup;
};

const boundedStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.length <= 2000 && value.every((item) => typeof item === 'string' && item.length <= 200)
    ? [...new Set(value)]
    : null;

const scoreMap = (value: unknown): Record<string, number> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > 2000 || entries.some(([key, score]) => key.length > 200 || typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)) return null;
  return Object.fromEntries(entries) as Record<string, number>;
};

const sanitizePlacementAssessment = (value: unknown): UserProfile['placementAssessment'] | null => {
  if (value === undefined || value === null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1 || typeof raw.startedAt !== 'string' || !Number.isFinite(Date.parse(raw.startedAt))) return null;
  if (!raw.answers || typeof raw.answers !== 'object' || Array.isArray(raw.answers)) return null;
  const answerEntries = Object.entries(raw.answers);
  if (answerEntries.length > 100 || answerEntries.some(([key, answer]) => key.length > 200 || typeof answer !== 'string' || answer.length > 500)) return null;
  if (raw.result === undefined) return { schemaVersion: 1, startedAt: raw.startedAt, answers: Object.fromEntries(answerEntries) };
  if (!raw.result || typeof raw.result !== 'object' || Array.isArray(raw.result)) return null;
  const result = raw.result as Record<string, unknown>;
  if (typeof result.completedAt !== 'string' || !Number.isFinite(Date.parse(result.completedAt)) ||
      !Number.isSafeInteger(result.correctCount) || (result.correctCount as number) < 0 ||
      !Number.isSafeInteger(result.answeredCount) || (result.answeredCount as number) < 0 ||
      typeof result.scorePercent !== 'number' || result.scorePercent < 0 || result.scorePercent > 100 ||
      !Number.isSafeInteger(result.suggestedStage) || (result.suggestedStage as number) < 1 || (result.suggestedStage as number) > 10 ||
      !Array.isArray(result.skillCoverage) || result.skillCoverage.length > 20 || result.skillCoverage.some((skill) => typeof skill !== 'string' || skill.length > 80) ||
      !Array.isArray(result.stages) || result.stages.length > 20) return null;
  const stages: NonNullable<NonNullable<UserProfile['placementAssessment']>['result']>['stages'] = [];
  for (const item of result.stages) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const stage = item as Record<string, unknown>;
    if (!Number.isSafeInteger(stage.stage) || (stage.stage as number) < 1 || (stage.stage as number) > 10 ||
        !Number.isSafeInteger(stage.correct) || (stage.correct as number) < 0 ||
        !Number.isSafeInteger(stage.total) || (stage.total as number) < 1 || (stage.correct as number) > (stage.total as number) ||
        typeof stage.passed !== 'boolean') return null;
    stages.push({ stage: stage.stage as number, correct: stage.correct as number, total: stage.total as number, passed: stage.passed });
  }
  const method = result.method === 'first_stage' || result.method === 'test' ? result.method : undefined;
  return {
    schemaVersion: 1,
    startedAt: raw.startedAt,
    answers: Object.fromEntries(answerEntries),
    result: {
      completedAt: result.completedAt,
      correctCount: result.correctCount as number,
      answeredCount: result.answeredCount as number,
      scorePercent: result.scorePercent,
      suggestedStage: result.suggestedStage as number,
      skillCoverage: result.skillCoverage as string[],
      stages,
      ...(method ? { method } : {}),
    },
  };
};

const sanitizeProfile = (value: unknown): UserProfile | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const likedLessonIds = boundedStringArray(raw.likedLessonIds);
  const favoriteLessonIds = boundedStringArray(raw.favoriteLessonIds);
  const watchedLessonIds = boundedStringArray(raw.watchedLessonIds);
  const completedLessonIds = boundedStringArray(raw.completedLessonIds);
  const savedWordIds = boundedStringArray(raw.savedWordIds);
  const masteredWordIds = boundedStringArray(raw.masteredWordIds);
  const reviewWordIds = boundedStringArray(raw.reviewWordIds);
  const quizScores = scoreMap(raw.quizScores);
  if ([likedLessonIds, favoriteLessonIds, watchedLessonIds, completedLessonIds, savedWordIds, masteredWordIds, reviewWordIds, quizScores].some((item) => item === null)) return null;
  if (!Number.isSafeInteger(raw.xp) || (raw.xp as number) < 0 || (raw.xp as number) > 100_000_000) return null;
  if (!Number.isSafeInteger(raw.streakDays) || (raw.streakDays as number) < 0 || (raw.streakDays as number) > 100_000) return null;
  if (!Number.isSafeInteger(raw.dailyGoalLessons) || (raw.dailyGoalLessons as number) < 1 || (raw.dailyGoalLessons as number) > 100) return null;
  if (typeof raw.lastActiveDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.lastActiveDate)) return null;

  const exams = raw.levelExamResults;
  if (!exams || typeof exams !== 'object' || Array.isArray(exams) || Object.keys(exams).length > 100) return null;
  const levelExamResults: UserProfile['levelExamResults'] = {};
  for (const [key, entry] of Object.entries(exams)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const exam = entry as Record<string, unknown>;
    const reviewTopics = boundedStringArray(exam.reviewTopics);
    const reviewIds = boundedStringArray(exam.reviewWordIds);
    if (!Number.isSafeInteger(exam.attempts) || (exam.attempts as number) < 0 || typeof exam.passed !== 'boolean' || !reviewTopics || !reviewIds) return null;
    if (typeof exam.bestScore !== 'number' || exam.bestScore < 0 || exam.bestScore > 100 || typeof exam.latestScore !== 'number' || exam.latestScore < 0 || exam.latestScore > 100) return null;
    levelExamResults[key] = {
      attempts: exam.attempts as number,
      bestScore: exam.bestScore,
      latestScore: exam.latestScore,
      passed: exam.passed,
      reviewTopics,
      reviewWordIds: reviewIds,
      ...(typeof exam.passedAt === 'string' ? { passedAt: exam.passedAt } : {}),
    };
  }

  const dailyProgress = raw.dailyProgress;
  if (!dailyProgress || typeof dailyProgress !== 'object' || Array.isArray(dailyProgress)) return null;
  const daily = dailyProgress as Record<string, unknown>;
  const dailyCompleted = boundedStringArray(daily.completedLessonIds);
  if (typeof daily.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(daily.date) || !dailyCompleted) return null;

  const settings = raw.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null;
  const config = settings as Record<string, unknown>;
  if (typeof config.playbackSpeed !== 'number' || ![0.5, 0.75, 1].includes(config.playbackSpeed)) return null;
  if (!['both', 'en', 'ar', 'none'].includes(String(config.subtitlesMode)) || typeof config.soundEffects !== 'boolean' || typeof config.autoNext !== 'boolean') return null;
  const placementAssessment = sanitizePlacementAssessment(raw.placementAssessment);
  if (placementAssessment === null) return null;

  const displayName = typeof raw.displayName === 'string'
    ? raw.displayName.trim().slice(0, 40)
    : undefined;
  const profileTagline = typeof raw.profileTagline === 'string'
    ? raw.profileTagline.trim().slice(0, 80)
    : undefined;
  const joinedAt = typeof raw.joinedAt === 'string' && Number.isFinite(Date.parse(raw.joinedAt))
    ? raw.joinedAt
    : undefined;
  const avatarDataUrl = typeof raw.avatarDataUrl === 'string' &&
    raw.avatarDataUrl.length <= 200_000 &&
    /^data:image\/(?:png|jpeg|webp);base64,/i.test(raw.avatarDataUrl)
    ? raw.avatarDataUrl
    : undefined;

  return {
    ...(displayName ? { displayName } : {}),
    ...(profileTagline ? { profileTagline } : {}),
    ...(joinedAt ? { joinedAt } : {}),
    ...(avatarDataUrl ? { avatarDataUrl } : {}),
    xp: raw.xp as number,
    streakDays: raw.streakDays as number,
    lastActiveDate: raw.lastActiveDate,
    likedLessonIds: likedLessonIds!, favoriteLessonIds: favoriteLessonIds!, watchedLessonIds: watchedLessonIds!,
    completedLessonIds: completedLessonIds!, savedWordIds: savedWordIds!, masteredWordIds: masteredWordIds!, reviewWordIds: reviewWordIds!,
    quizScores: quizScores!, levelExamResults,
    ...(placementAssessment ? { placementAssessment } : {}),
    dailyGoalLessons: raw.dailyGoalLessons as number,
    dailyProgress: { date: daily.date, completedLessonIds: dailyCompleted },
    settings: {
      playbackSpeed: config.playbackSpeed as number,
      subtitlesMode: config.subtitlesMode as UserSettings['subtitlesMode'],
      soundEffects: config.soundEffects,
      autoNext: config.autoNext,
      voiceLanguage: normalizeSpeechLanguage(config.voiceLanguage ?? config.voiceAccent),
    },
  };
};

export const getLocalProgressBackup = (codeInput: string): ProgressBackup | null => {
  const code = codeInput.trim().toUpperCase();
  if (!isValidProgressCode(code)) return null;
  const backup = readProgressBackups()[code];
  if (!backup || backup.code !== code || backup.format !== PROGRESS_BACKUP_FORMAT || backup.schemaVersion !== PROGRESS_BACKUP_SCHEMA_VERSION) return null;
  const profile = sanitizeProfile(backup.profile);
  return profile ? { ...backup, profile } : null;
};

export const parseProgressBackupFile = (contents: string, codeInput: string): ProgressBackup => {
  const code = codeInput.trim().toUpperCase();
  if (!isValidProgressCode(code)) throw new Error('أدخل الرمز بصيغة 3 أحرف إنجليزية ثم 3 أرقام.');
  if (contents.length > 2_000_000) throw new Error('حجم ملف النسخة الاحتياطية أكبر من الحد المسموح.');
  let parsed: unknown;
  try { parsed = JSON.parse(contents) as unknown; } catch { throw new Error('ملف النسخة الاحتياطية ليس JSON صالحًا.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('بنية ملف النسخة الاحتياطية غير صالحة.');
  const raw = parsed as Record<string, unknown>;
  if (raw.format !== PROGRESS_BACKUP_FORMAT || raw.schemaVersion !== PROGRESS_BACKUP_SCHEMA_VERSION) throw new Error('إصدار ملف النسخة الاحتياطية غير مدعوم.');
  if (typeof raw.code !== 'string' || raw.code.toUpperCase() !== code) throw new Error('الرمز لا يطابق ملف النسخة الاحتياطية.');
  if (typeof raw.createdAt !== 'string' || !Number.isFinite(Date.parse(raw.createdAt))) throw new Error('تاريخ النسخة الاحتياطية غير صالح.');
  const profile = sanitizeProfile(raw.profile);
  if (!profile) throw new Error('بيانات التقدم غير صالحة أو لا تطابق مخطط EnglishTok.');
  const backup: ProgressBackup = { format: PROGRESS_BACKUP_FORMAT, schemaVersion: PROGRESS_BACKUP_SCHEMA_VERSION, code, createdAt: raw.createdAt, profile };
  writeProgressBackup(backup);
  return backup;
};

export const getUserRank = (xp: number): { titleAr: string; titleEn: string; nextThreshold: number; progressPercent: number } => {
  if (xp < 100) {
    return { titleAr: 'مبتدئ شغوف', titleEn: 'Eager Beginner', nextThreshold: 100, progressPercent: (xp / 100) * 100 };
  }
  if (xp < 300) {
    return { titleAr: 'مستكشف الكلمات', titleEn: 'Word Explorer', nextThreshold: 300, progressPercent: ((xp - 100) / 200) * 100 };
  }
  if (xp < 700) {
    return { titleAr: 'متحدث واثق', titleEn: 'Confident Speaker', nextThreshold: 700, progressPercent: ((xp - 300) / 400) * 100 };
  }
  if (xp < 1500) {
    return { titleAr: 'محاور طليق', titleEn: 'Fluent Converser', nextThreshold: 1500, progressPercent: ((xp - 700) / 800) * 100 };
  }
  return { titleAr: 'خبير إنجليزي بارع', titleEn: 'English Master', nextThreshold: 3000, progressPercent: Math.min(100, ((xp - 1500) / 1500) * 100) };
};
