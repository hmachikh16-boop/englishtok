import type { CategoryKey, Level, SceneType } from '../../types';

/**
 * Compact source format for the expanded curriculum.
 *
 * A single entry carries only what cannot be derived safely:
 * - the lesson metadata,
 * - four vocabulary rows (word, part of speech, Arabic meaning, example EN/AR),
 * - an opening and a closing line that frame the mini-dialogue.
 *
 * The dialogue is assembled from the examples (one line per word) and the quiz
 * is generated from the same data, so every lesson stays internally consistent
 * even when hundreds of lessons are added.
 */
export type ExpansionWordTuple = readonly [
  /** English word or phrase exactly as it appears in the example. */
  word: string,
  /** Arabic part of speech, e.g. اسم / فعل / صفة / تعبير. */
  partOfSpeech: string,
  /** Arabic meaning. */
  translationAr: string,
  /** Natural example sentence that contains `word`. */
  exampleSentence: string,
  /** Arabic translation of the example sentence. */
  exampleSentenceAr: string,
  /** Optional IPA carried over from an existing vocabulary row. */
  phonetic?: string,
];

export interface ExpansionLessonSpec {
  /** Stable lesson id, e.g. `a1-l5-family`. */
  id: string;
  /** URL-friendly slug. */
  slug: string;
  /** CURRICULUM_LEVELS stage: 1, 2, 3 or 4. */
  stage: number;
  /** CEFR label shown in the library. */
  level: Level;
  title: string;
  titleAr: string;
  descriptionAr: string;
  objectiveAr: string;
  /** Model sentence used by the arrange exercise; keep it short and clean. */
  structureEn: string;
  structureAr: string;
  methodNoteAr?: string;
  category: CategoryKey;
  scene: SceneType;
  /** First dialogue line (character B). */
  openingEn: string;
  openingAr: string;
  /** Exactly four vocabulary rows; they become the middle dialogue lines. */
  words: readonly ExpansionWordTuple[];
  /** Last dialogue line (character A). */
  closingEn: string;
  closingAr: string;
  /**
   * Extension lessons reuse existing vocabulary and audio. Their fill-in
   * prompt is visible on screen but not spoken, so the build does not need a
   * new clip for every generated blank sentence.
   */
  skipFillAudio?: boolean;
}

export const expansionLesson = (spec: ExpansionLessonSpec): ExpansionLessonSpec => spec;
