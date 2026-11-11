import type { Lesson } from '../types';
import { LEVEL_CHARACTERS } from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_2A_LESSONS } from './expansion/stage2a';
import { STAGE_2F_LESSONS } from './expansion/stage2f';

/**
 * Stage 2 (المرحلة الثانية) — A2/B1 "التعلم القائم على المهام والتواصل اليومي".
 *
 * Replaces the previous Stage 2 track with the roadmap designed for the app:
 * daily routine, a day in the city, restaurant & preferences, past events and
 * future plans & directions. The old A2/B1 expansion packs (stage2a, stage2b,
 * expansionPlus stage2) remain on disk but are no longer loaded here.
 */
export async function loadStageLessons(): Promise<Lesson[]> {
  return [
    ...STAGE_2A_LESSONS,
    ...STAGE_2F_LESSONS,
  ].map((spec) => buildExpansionLesson(spec, LEVEL_CHARACTERS[2]));
}
