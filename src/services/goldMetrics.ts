import type { Lesson, UserProfile } from '../types';
import type { LearningPathState } from './learningPath';

/**
 * Gold+ progress is derived from the same local profile as the free edition.
 * Nothing new is written to the backup schema, so restoring a Free backup in
 * Gold (or the reverse) keeps working without a migration.
 */

export interface GoldLeague {
  id: string;
  titleAr: string;
  titleEn: string;
  minXp: number;
  nextXp: number | null;
  progressPercent: number;
  isTopTier: boolean;
}

export interface GoldSkill {
  id: 'listening' | 'speaking' | 'vocabulary' | 'grammar';
  titleAr: string;
  titleEn: string;
  value: number;
  detailAr: string;
}

export interface GoldMetrics {
  gems: number;
  crowns: number;
  completedLessons: number;
  totalLessons: number;
  goldProjectsCompleted: number;
  goldProjectsTotal: number;
  league: GoldLeague;
  skills: GoldSkill[];
  dailyLessons: number;
  dailyGoal: number;
  dailyChestReady: boolean;
  masteredWords: number;
  totalWords: number;
}

const LEAGUES: Array<Omit<GoldLeague, 'progressPercent' | 'isTopTier'>> = [
  { id: 'bronze', titleAr: 'دوري البرونز', titleEn: 'Bronze', minXp: 0, nextXp: 250 },
  { id: 'silver', titleAr: 'دوري الفضة', titleEn: 'Silver', minXp: 250, nextXp: 750 },
  { id: 'gold', titleAr: 'دوري الذهب', titleEn: 'Gold', minXp: 750, nextXp: 1_500 },
  { id: 'sapphire', titleAr: 'دوري الياقوت', titleEn: 'Sapphire', minXp: 1_500, nextXp: 3_000 },
  { id: 'diamond', titleAr: 'دوري الألماس', titleEn: 'Diamond', minXp: 3_000, nextXp: 6_000 },
  { id: 'champion', titleAr: 'دوري الأبطال', titleEn: 'Champion', minXp: 6_000, nextXp: null },
];

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));

export const getGoldLeague = (xp: number): GoldLeague => {
  const safeXp = Math.max(0, Number.isFinite(xp) ? xp : 0);
  const tier = [...LEAGUES].reverse().find((entry) => safeXp >= entry.minXp) ?? LEAGUES[0];
  const span = tier.nextXp === null ? 1 : Math.max(1, tier.nextXp - tier.minXp);
  return {
    ...tier,
    progressPercent:
      tier.nextXp === null ? 100 : clampPercent(((safeXp - tier.minXp) / span) * 100),
    isTopTier: tier.nextXp === null,
  };
};

const countPassedExams = (profile: UserProfile): number =>
  Object.values(profile.levelExamResults ?? {}).filter((exam) => exam?.passed === true).length;

const countGoldProjectLessons = (lessons: Lesson[]): Lesson[] =>
  lessons.filter((lesson) => lesson.id.startsWith('gold-project-stage-'));

export const getGoldMetrics = (
  profile: UserProfile,
  lessons: Lesson[],
  path: LearningPathState,
): GoldMetrics => {
  const completedIds = new Set(profile.completedLessonIds ?? []);
  const allWords = lessons.flatMap((lesson) => lesson.vocabulary);
  const wordIds = new Set(allWords.map((word) => word.id));
  const masteredWords = (profile.masteredWordIds ?? []).filter((id) => wordIds.has(id)).length;
  const completedLessons = lessons.reduce(
    (total, lesson) => total + (completedIds.has(lesson.id) ? 1 : 0),
    0,
  );
  const totalLessons = Math.max(0, path.totalLessons || lessons.length);
  const goldProjects = countGoldProjectLessons(lessons);
  const goldProjectsCompleted = goldProjects.filter((lesson) => completedIds.has(lesson.id)).length;
  const passedExams = countPassedExams(profile);
  const totalExamStages = Math.max(1, path.levels.length);
  const quizScores = Object.values(profile.quizScores ?? {}).filter((score) => score >= 70).length;
  const today = new Date().toISOString().slice(0, 10);
  const dailyLessons = profile.dailyProgress?.date === today
    ? profile.dailyProgress.completedLessonIds.filter((id) => lessons.some((lesson) => lesson.id === id)).length
    : 0;
  const dailyGoal = Math.max(1, profile.dailyGoalLessons || 1);
  const xp = Math.max(0, profile.xp || 0);

  const skills: GoldSkill[] = [
    {
      id: 'listening',
      titleAr: 'الاستماع',
      titleEn: 'Listening',
      value: totalLessons ? clampPercent((path.completedCount / totalLessons) * 100) : 0,
      detailAr: `${path.completedCount} من ${totalLessons} درسًا`,
    },
    {
      id: 'speaking',
      titleAr: 'التحدث',
      titleEn: 'Speaking',
      value: completedLessons ? clampPercent((quizScores / completedLessons) * 100) : 0,
      detailAr: `${quizScores} اختبارًا بدرجة 70%+`,
    },
    {
      id: 'vocabulary',
      titleAr: 'المفردات',
      titleEn: 'Vocabulary',
      value: allWords.length ? clampPercent((masteredWords / allWords.length) * 100) : 0,
      detailAr: `${masteredWords} من ${allWords.length} كلمة`,
    },
    {
      id: 'grammar',
      titleAr: 'القواعد',
      titleEn: 'Grammar',
      value: clampPercent((passedExams / totalExamStages) * 100),
      detailAr: `${passedExams} من ${totalExamStages} اختبار مرحلة`,
    },
  ];

  return {
    gems: Math.floor(xp / 10) + completedLessons * 2,
    crowns: passedExams + goldProjectsCompleted,
    completedLessons,
    totalLessons,
    goldProjectsCompleted,
    goldProjectsTotal: goldProjects.length,
    league: getGoldLeague(xp),
    skills,
    dailyLessons,
    dailyGoal,
    dailyChestReady: dailyLessons >= dailyGoal,
    masteredWords,
    totalWords: allWords.length,
  };
};
