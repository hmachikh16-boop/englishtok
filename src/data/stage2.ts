import type { Lesson } from '../types';
import {
  LESSON_SPECS,
  LEVEL_CHARACTERS,
  buildLesson,
} from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_2A_LESSONS } from './expansion/stage2a';
import { STAGE_2B_LESSONS } from './expansion/stage2b';
import { STAGE_2_PLUS_LESSONS } from './expansionPlus/stage2';
import { STAGE_2_PLUS2_LESSONS } from './expansionPlus2/stage2';

export async function loadStageLessons(): Promise<Lesson[]> {
  const specs = [
    ...STAGE_2A_LESSONS,
    ...STAGE_2B_LESSONS,
    ...STAGE_2_PLUS_LESSONS,
    ...STAGE_2_PLUS2_LESSONS,
  ];
  const baseLessons = LESSON_SPECS.filter((spec) => spec.stage === 2).map(buildLesson);
  const expansionLessons = specs.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[2]),
  );
  return [...baseLessons, ...expansionLessons].sort(
    (left, right) => (left.curriculumStage ?? 0) - (right.curriculumStage ?? 0),
  );
}
