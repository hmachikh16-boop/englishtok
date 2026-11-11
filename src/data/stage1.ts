import type { Lesson } from '../types';
import { LEVEL_CHARACTERS } from './curriculumContent';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import { STAGE_1C_LESSONS } from './expansion/stage1c';
import { STAGE_1D_LESSONS } from './expansion/stage1d';
import { STAGE_1E_LESSONS } from './expansion/stage1e';

/**
 * Stage 1 (المرحلة الأولى) — the primary-school foundations track.
 *
 * This stage now contains ONLY the syllabus defined by the classroom wall
 * charts (letter sounds, short/long vowels, vowel teams, digraphs, blends,
 * r-controlled vowels, diphthongs, silent letters, soft/hard C and G, the
 * schwa; then the first words and the first grammar) authored in
 * `expansion/stage1c.ts` (30 lessons + the Gold project inserted by
 * `goldCurriculum.ts`).
 *
 * The previous 200-lesson A1 expansion packs (expansion/stage1a,
 * expansion/stage1b, expansionPlus packs/stage1) are intentionally NOT loaded
 * here: their topics duplicate the foundation sequence. Their source files
 * remain on disk, so the old track can be restored by re-importing those
 * packs and concatenating them back into this loader.
 */
export async function loadStageLessons(): Promise<Lesson[]> {
  return [
    ...STAGE_1C_LESSONS,
    ...STAGE_1D_LESSONS,
    ...STAGE_1E_LESSONS,
  ].map((spec) => buildExpansionLesson(spec, LEVEL_CHARACTERS[1]));
}
