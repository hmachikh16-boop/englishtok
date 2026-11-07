import type { Lesson } from '../types';
import {
  LESSON_SPECS,
  LEVEL_CHARACTERS,
  buildLesson,
} from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_3A_LESSONS } from './expansion/stage3a';
import { STAGE_3B_LESSONS } from './expansion/stage3b';
import { STAGE_3_PLUS_LESSONS } from './expansionPlus/stage3';
import { STAGE_3_PLUS2_LESSONS } from './expansionPlus2/stage3';
import { STAGE_3_PLUS3_LESSONS } from './expansionPlus3/stage3';

export async function loadStageLessons(): Promise<Lesson[]> {
  const specs = [
    ...STAGE_3A_LESSONS,
    ...STAGE_3B_LESSONS,
    ...STAGE_3_PLUS_LESSONS,
    ...STAGE_3_PLUS2_LESSONS,
    ...STAGE_3_PLUS3_LESSONS,
  ];
  const baseLessons = LESSON_SPECS.filter((spec) => spec.stage === 3).map(buildLesson);
  const expansionLessons = specs.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[3]),
  );
  return [...baseLessons, ...expansionLessons].sort(
    (left, right) => (left.curriculumStage ?? 0) - (right.curriculumStage ?? 0),
  );
}
