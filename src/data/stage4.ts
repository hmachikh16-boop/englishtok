import type { Lesson } from '../types';
import { LEVEL_CHARACTERS } from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_4A_LESSONS } from './expansion/stage4a';

/**
 * Stage 4 (المرحلة الرابعة) — C1/C2 "الدقة، الطلاقة، والمصطلحات المتخصصة".
 *
 * Replaces the previous Stage 4 track with the roadmap designed for the app:
 * academic & formal English, professional presentation, advanced idioms &
 * collocations, advanced grammar & inversion, negotiation & conflict resolution.
 * The old C1/C2 expansion packs (stage4a, stage4b, expansionPlus stage4) remain
 * on disk but are no longer loaded here.
 */
export async function loadStageLessons(): Promise<Lesson[]> {
  return STAGE_4A_LESSONS.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[4]),
  );
}
