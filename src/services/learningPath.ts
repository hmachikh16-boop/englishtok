import type { Lesson, LevelExamResult, UserProfile } from '../types';
import { CURRICULUM_CONFIG, CURRICULUM_LEVELS } from '../data/curriculum';

export type LessonPathStatus = 'completed' | 'current' | 'available' | 'locked';

export interface LessonPathEntry {
  lesson: Lesson;
  status: LessonPathStatus;
}

export interface LevelPathEntry {
  stage: number;
  titleAr: string;
  subtitleAr: string;
  lessons: LessonPathEntry[];
  completedCount: number;
  isUnlocked: boolean;
  canTakeExam: boolean;
  examPassed: boolean;
  examResult?: LevelExamResult;
}

export interface LearningPathState {
  levels: LevelPathEntry[];
  lessonStatusById: Map<string, LessonPathStatus>;
  accessibleLessons: Lesson[];
  nextLessonId: string;
  completedCount: number;
  totalLessons: number;
}

export const getLearningPathState = (
  lessons: Lesson[],
  profile: UserProfile
): LearningPathState => {
  // School-year lessons have their own five-course prerequisite sequence in
  // the primary-school explorer. Keep them out of the seven existing English
  // stages so adding a school course cannot invalidate old exam results.
  const pathLessons = lessons.filter((lesson) => !lesson.schoolYearId);
  const completedIds = new Set(profile.completedLessonIds);
  const pathLessonIds = new Set(pathLessons.map((lesson) => lesson.id));
  const pathCompletedCount = [...completedIds].filter((id) => pathLessonIds.has(id)).length;
  const examResults = profile.levelExamResults ?? {};
  const recommendedStartStage = Math.min(
    CURRICULUM_LEVELS.length,
    Math.max(1, profile.placementAssessment?.result?.suggestedStage ?? 1),
  );
  let previousStagePassed = true;
  const lessonStatusById = new Map<string, LessonPathStatus>();

  const levels = CURRICULUM_LEVELS.map((level) => {
    const stageLessons = pathLessons.filter((lesson) => lesson.curriculumStage === level.stage);
    const completedCount = stageLessons.filter((lesson) => completedIds.has(lesson.id)).length;
    const isBeforeRecommendedStart = level.stage < recommendedStartStage;
    const isUnlocked = isBeforeRecommendedStart || level.stage === recommendedStartStage || previousStagePassed;
    const canTakeExam = stageLessons.length > 0 && completedCount === stageLessons.length;
    const examResult = examResults[String(level.stage)];
    const examPassed = examResult?.passed === true;
    let priorLessonCompleted = true;
    const lessonEntries = stageLessons.map((lesson): LessonPathEntry => {
      const complete = completedIds.has(lesson.id);
      const unlocked = isUnlocked && priorLessonCompleted;
      const status: LessonPathStatus = complete
        ? 'completed'
        : !unlocked
          ? 'locked'
          : stageLessons.find((entry) => !completedIds.has(entry.id))?.id === lesson.id
            ? 'current'
            : 'available';
      lessonStatusById.set(lesson.id, status);
      priorLessonCompleted = complete;
      return { lesson, status };
    });

    previousStagePassed = isBeforeRecommendedStart || (canTakeExam && examPassed);
    return {
      stage: level.stage,
      titleAr: level.titleAr,
      subtitleAr: level.subtitleAr,
      lessons: lessonEntries,
      completedCount,
      isUnlocked,
      canTakeExam,
      examPassed,
      examResult,
    };
  });

  const accessibleLessons = pathLessons.filter((lesson) => {
    const status = lessonStatusById.get(lesson.id);
    return status === 'completed' || status === 'current' || status === 'available';
  });
  const recommendedLessons = accessibleLessons.filter((lesson) => (lesson.curriculumStage ?? 1) >= recommendedStartStage);
  const nextLesson =
    recommendedLessons.find((lesson) => !completedIds.has(lesson.id)) ??
    recommendedLessons[0] ??
    accessibleLessons.find((lesson) => !completedIds.has(lesson.id)) ??
    accessibleLessons[0] ?? lessons[0];

  return {
    levels,
    lessonStatusById,
    accessibleLessons,
    nextLessonId: nextLesson.id,
    completedCount: pathCompletedCount,
    totalLessons: pathLessons.length,
  };
};

export const getLevelExamPassingScore = () => CURRICULUM_CONFIG.passingScorePercent;

