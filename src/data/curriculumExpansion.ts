import type { ExpansionLessonSpec } from './expansion/types';
import { STAGE_1A_LESSONS } from './expansion/stage1a';
import { STAGE_1B_LESSONS } from './expansion/stage1b';
import { STAGE_2A_LESSONS } from './expansion/stage2a';
import { STAGE_2B_LESSONS } from './expansion/stage2b';
import { STAGE_3A_LESSONS } from './expansion/stage3a';
import { STAGE_3B_LESSONS } from './expansion/stage3b';
import { STAGE_4A_LESSONS } from './expansion/stage4a';
import { STAGE_4B_LESSONS } from './expansion/stage4b';
import { STAGE_1_PLUS_LESSONS } from './expansionPlus/stage1';
import { STAGE_2_PLUS_LESSONS } from './expansionPlus/stage2';
import { STAGE_3_PLUS_LESSONS } from './expansionPlus/stage3';
import { STAGE_4_PLUS_LESSONS } from './expansionPlus/stage4';
import { STAGE_1_PLUS2_LESSONS } from './expansionPlus2/stage1';
import { STAGE_2_PLUS2_LESSONS } from './expansionPlus2/stage2';
import { STAGE_3_PLUS2_LESSONS } from './expansionPlus2/stage3';
import { STAGE_4_PLUS2_LESSONS } from './expansionPlus2/stage4';

/**
 * 96 expansion lessons per stage, authored in src/data/expansion and
 * src/data/expansionPlus, merged with the four original lessons in
 * curriculumContent.ts to reach 100 lessons per stage (400 total).
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
  ...STAGE_1_PLUS_LESSONS,
  ...STAGE_2_PLUS_LESSONS,
  ...STAGE_3_PLUS_LESSONS,
  ...STAGE_4_PLUS_LESSONS,
  ...STAGE_1_PLUS2_LESSONS,
  ...STAGE_2_PLUS2_LESSONS,
  ...STAGE_3_PLUS2_LESSONS,
  ...STAGE_4_PLUS2_LESSONS,
];
