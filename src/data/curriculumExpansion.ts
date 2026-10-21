import type { ExpansionLessonSpec } from './expansion/types';
import { STAGE_1A_LESSONS } from './expansion/stage1a';
import { STAGE_1B_LESSONS } from './expansion/stage1b';
import { STAGE_2A_LESSONS } from './expansion/stage2a';
import { STAGE_2B_LESSONS } from './expansion/stage2b';
import { STAGE_3A_LESSONS } from './expansion/stage3a';
import { STAGE_3B_LESSONS } from './expansion/stage3b';
import { STAGE_4A_LESSONS } from './expansion/stage4a';
import { STAGE_4B_LESSONS } from './expansion/stage4b';

/**
 * 46 new lessons per stage, authored in src/data/expansion and merged with the
 * four original lessons in curriculumContent.ts to reach 50 lessons per stage.
 */
export const EXPANSION_LESSONS: readonly ExpansionLessonSpec[] = [
  ...STAGE_1A_LESSONS,
  ...STAGE_1B_LESSONS,
  ...STAGE_2A_LESSONS,
  ...STAGE_2B_LESSONS,
  ...STAGE_3A_LESSONS,
  ...STAGE_3B_LESSONS,
  ...STAGE_4A_LESSONS,
  ...STAGE_4B_LESSONS,
];
