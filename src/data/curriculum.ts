import type { Lesson } from '../types';
import {
  CURRICULUM_LESSONS,
  CURRICULUM_LEVELS as CURRICULUM_LEVEL_CONTENT,
  type CurriculumLevel,
} from './curriculumContent';

export type { CurriculumLevel };

/**
 * The EnglishTok learning path built from the four-level curriculum module.
 *
 * Level 1 (A1)      phonics + spaced repetition — Leo & Gigi
 * Level 2 (A2/B1)   task-based learning — Alex & Maya
 * Level 3 (B2)      critical communication + idioms — Sarah & David
 * Level 4 (C1/C2)   immersion + nuance + rhetoric — Dr. Arthur & Elena
 *
 * Lessons carry `curriculumStage`, so the path unlocks level by level.
 */

export const CURRICULUM_CONFIG = {
  passingScorePercent: 80,
  expectedLessonCount: CURRICULUM_LESSONS.length,
} as const;

export const CURRICULUM_LEVELS: readonly CurriculumLevel[] = CURRICULUM_LEVEL_CONTENT;

export const LEARNING_PATH_LESSONS: Lesson[] = CURRICULUM_LESSONS;
