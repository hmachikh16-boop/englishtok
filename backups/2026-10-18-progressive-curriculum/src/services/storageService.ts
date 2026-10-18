import { UserProfile, UserSettings } from '../types';

const STORAGE_KEY = 'englishtok_user_profile_v1';

const DEFAULT_SETTINGS: UserSettings = {
  playbackSpeed: 1.0,
  subtitlesMode: 'both',
  soundEffects: true,
  autoNext: false,
  voiceAccent: 'en-US',
};

const DEFAULT_PROFILE: UserProfile = {
  xp: 120,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  likedLessonIds: ['lesson-cafe-01'],
  favoriteLessonIds: ['lesson-cafe-01'],
  watchedLessonIds: ['lesson-cafe-01'],
  completedLessonIds: [],
  savedWordIds: ['v1', 'v2'],
  masteredWordIds: [],
  quizScores: {},
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
      } else if (diffDays > 1) {
        parsed.streakDays = 1;
      }
      parsed.lastActiveDate = today;
      saveProfile(parsed);
    }
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
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
