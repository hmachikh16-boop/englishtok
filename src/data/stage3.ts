import type { Lesson } from '../types';
import { LEVEL_CHARACTERS } from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_3A_LESSONS } from './expansion/stage3a';

/**
 * Stage 3 (المرحلة الثالثة) — B2 "التواصل الناقد والتعبير عن الرأي والمصطلحات".
 *
 * Replaces the previous Stage 3 track with the roadmap designed for the app:
 * expressing opinions & debating, professional debate project, idioms & phrasal
 * verbs, complex grammar & conditionals, contemporary issues & future. The old
 * B2 expansion packs (stage3a, stage3b, expansionPlus stage3) remain on disk
 * but are no longer loaded here.
 */
export async function loadStageLessons(): Promise<Lesson[]> {
  return STAGE_3A_LESSONS.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[3]),
  );
}
