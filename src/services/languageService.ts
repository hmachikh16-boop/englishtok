import type {
  LanguageProgress,
  TargetLanguage,
  UserProfile,
} from '../types';

const todayKey = () => new Date().toISOString().slice(0, 10);

const emptyLanguageProgress = (): LanguageProgress => ({
  likedLessonIds: [],
  favoriteLessonIds: [],
  watchedLessonIds: [],
  completedLessonIds: [],
  savedWordIds: [],
  masteredWordIds: [],
  reviewWordIds: [],
  quizScores: {},
  levelExamResults: {},
  dailyProgress: { date: todayKey(), completedLessonIds: [] },
});

/**
 * Copy the active course progress into a language snapshot. XP, streak and the
 * profile identity deliberately stay global so the learner never loses them.
 */
export const captureLanguageProgress = (profile: UserProfile): LanguageProgress => ({
  likedLessonIds: [...profile.likedLessonIds],
  favoriteLessonIds: [...profile.favoriteLessonIds],
  watchedLessonIds: [...profile.watchedLessonIds],
  completedLessonIds: [...profile.completedLessonIds],
  savedWordIds: [...profile.savedWordIds],
  masteredWordIds: [...profile.masteredWordIds],
  reviewWordIds: [...profile.reviewWordIds],
  quizScores: { ...profile.quizScores },
  levelExamResults: { ...profile.levelExamResults },
  ...(profile.placementAssessment
    ? { placementAssessment: profile.placementAssessment }
    : {}),
  dailyProgress: {
    date: profile.dailyProgress.date,
    completedLessonIds: [...profile.dailyProgress.completedLessonIds],
  },
});

const activeFieldsFor = (progress: LanguageProgress): Partial<UserProfile> => ({
  likedLessonIds: [...progress.likedLessonIds],
  favoriteLessonIds: [...progress.favoriteLessonIds],
  watchedLessonIds: [...progress.watchedLessonIds],
  completedLessonIds: [...progress.completedLessonIds],
  savedWordIds: [...progress.savedWordIds],
  masteredWordIds: [...progress.masteredWordIds],
  reviewWordIds: [...progress.reviewWordIds],
  quizScores: { ...progress.quizScores },
  levelExamResults: { ...progress.levelExamResults },
  placementAssessment: progress.placementAssessment,
  dailyProgress:
    progress.dailyProgress.date === todayKey()
      ? {
          date: progress.dailyProgress.date,
          completedLessonIds: [...progress.dailyProgress.completedLessonIds],
        }
      : { date: todayKey(), completedLessonIds: [] },
});

/**
 * Switch the active course without touching the other language's progress.
 * The old top-level fields are snapshotted before the new course is loaded.
 */
export const switchLearningLanguage = (
  profile: UserProfile,
  targetLanguage: TargetLanguage,
): UserProfile => {
  if (profile.targetLanguage === targetLanguage) {
    return {
      ...profile,
      settings: { ...profile.settings, voiceLanguage: targetLanguage },
    };
  }

  const languageProgress = { ...profile.languageProgress };
  // Profiles created before the language gate have English as their active course.
  const previousLanguage = profile.targetLanguage ?? 'en';
  languageProgress[previousLanguage] = captureLanguageProgress(profile);
  const nextProgress = languageProgress[targetLanguage] ?? emptyLanguageProgress();

  return {
    ...profile,
    targetLanguage,
    languageProgress,
    ...activeFieldsFor(nextProgress),
    settings: { ...profile.settings, voiceLanguage: targetLanguage },
  };
};

export const targetLanguageLabelAr = (language: TargetLanguage): string =>
  language === 'fr' ? 'الفرنسية' : 'الإنجليزية';
