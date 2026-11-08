import type { Lesson } from '../types';
import {
  LESSON_SPECS,
  LEVEL_CHARACTERS,
  buildLesson,
} from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_4A_LESSONS } from './expansion/stage4a';
import { STAGE_4B_LESSONS } from './expansion/stage4b';
import { STAGE_4_PLUS_LESSONS } from './expansionPlus/stage4';
import { STAGE_4_PLUS2_LESSONS } from './expansionPlus2/stage4';
import { STAGE_4_PLUS3_LESSONS } from './expansionPlus3/stage4';
import { STAGE_4_PLUS4_LESSONS } from './expansionPlus4/stage4';

export async function loadStageLessons(): Promise<Lesson[]> {
  const specs = [
    ...STAGE_4A_LESSONS,
    ...STAGE_4B_LESSONS,
    ...STAGE_4_PLUS_LESSONS,
    ...STAGE_4_PLUS2_LESSONS,
    ...STAGE_4_PLUS3_LESSONS,
    ...STAGE_4_PLUS4_LESSONS,
  ];
  const baseLessons = LESSON_SPECS.filter((spec) => spec.stage === 4).map(buildLesson);
  const expansionLessons = specs.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[4]),
  );
  return [...baseLessons, ...expansionLessons].sort(
    (left, right) => (left.curriculumStage ?? 0) - (right.curriculumStage ?? 0),
  );
}
