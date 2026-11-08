import type { Lesson } from '../types';
import {
  LESSON_SPECS,
  LEVEL_CHARACTERS,
  buildLesson,
} from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_1A_LESSONS } from './expansion/stage1a';
import { STAGE_1B_LESSONS } from './expansion/stage1b';
import { STAGE_1_PLUS_LESSONS } from './expansionPlus/stage1';
import { STAGE_1_PLUS2_LESSONS } from './expansionPlus2/stage1';
import { STAGE_1_PLUS3_LESSONS } from './expansionPlus3/stage1';
import { STAGE_1_PLUS4_LESSONS } from './expansionPlus4/stage1';

export async function loadStageLessons(): Promise<Lesson[]> {
  const specs = [
    ...STAGE_1A_LESSONS,
    ...STAGE_1B_LESSONS,
    ...STAGE_1_PLUS_LESSONS,
    ...STAGE_1_PLUS2_LESSONS,
    ...STAGE_1_PLUS3_LESSONS,
    ...STAGE_1_PLUS4_LESSONS,
  ];
  const baseLessons = LESSON_SPECS.filter((spec) => spec.stage === 1).map(buildLesson);
  const expansionLessons = specs.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[1]),
  );
  return [...baseLessons, ...expansionLessons].sort(
    (left, right) => (left.curriculumStage ?? 0) - (right.curriculumStage ?? 0),
  );
}
