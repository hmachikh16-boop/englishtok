import type { CategoryKey, Lesson } from '../types';
import { getGamePicture, type GamePicture } from '../data/gamePictureClues';

export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameStageFilter = 'all' | 1 | 2 | 3 | 4;
export type GameDifficultyFilter = 'all' | GameDifficulty;

export interface GamePuzzle {
  id: string;
  word: string;
  translationAr: string;
  phonetic: string;
  partOfSpeech: string;
  exampleSentence: string;
  exampleSentenceAr: string;
  lessonId: string;
  lessonTitleAr: string;
  category: CategoryKey;
  stage: number;
  difficulty: GameDifficulty;
  picture: GamePicture | null;
}

export const GAME_DIFFICULTIES: Array<{
  value: GameDifficultyFilter;
  labelAr: string;
  shortLabelAr: string;
}> = [
  { value: 'easy', labelAr: 'سهل · 3–5 حروف', shortLabelAr: 'سهل' },
  { value: 'medium', labelAr: 'متوسط · 6–8 حروف', shortLabelAr: 'متوسط' },
  { value: 'hard', labelAr: 'متقدم · 9+ حروف', shortLabelAr: 'متقدم' },
  { value: 'all', labelAr: 'كل المستويات', shortLabelAr: 'الكل' },
];

export const GAME_STAGES: Array<{ value: GameStageFilter; labelAr: string }> = [
  { value: 1, labelAr: 'المرحلة 1' },
  { value: 2, labelAr: 'المرحلة 2' },
  { value: 3, labelAr: 'المرحلة 3' },
  { value: 4, labelAr: 'المرحلة 4' },
  { value: 'all', labelAr: 'كل المراحل' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒ'.split('');

export const difficultyFromWord = (word: string): GameDifficulty => {
  const length = Array.from(word).length;
  if (length <= 5) return 'easy';
  if (length <= 8) return 'medium';
  return 'hard';
};

/**
 * Build one spelling puzzle per unique, single-word vocabulary item in the
 * curriculum. Phrases, hyphenated words and very long words are skipped so the
 * game stays friendly for young learners and works with a simple letter grid.
 */
export const buildGamePuzzles = (lessons: Lesson[]): GamePuzzle[] => {
  const seenWords = new Set<string>();
  const puzzles: GamePuzzle[] = [];

  lessons.forEach((lesson) => {
    const stage = lesson.curriculumStage ?? 1;
    lesson.vocabulary.forEach((vocabularyWord) => {
      const rawWord = vocabularyWord.word.trim();
      const normalized = rawWord.normalize('NFC').toLowerCase();
      if (
        !/^[a-zàâäçéèêëîïôöùûüÿœ]{3,12}$/u.test(normalized) ||
        !vocabularyWord.translationAr.trim() ||
        seenWords.has(normalized)
      ) {
        return;
      }

      seenWords.add(normalized);
      puzzles.push({
        id: vocabularyWord.id,
        word: normalized.toUpperCase(),
        translationAr: vocabularyWord.translationAr,
        phonetic: vocabularyWord.phonetic,
        partOfSpeech: vocabularyWord.partOfSpeech,
        exampleSentence: vocabularyWord.exampleSentence,
        exampleSentenceAr: vocabularyWord.exampleSentenceAr,
        lessonId: lesson.id,
        lessonTitleAr: lesson.titleAr,
        category: lesson.category,
        stage,
        difficulty: difficultyFromWord(normalized),
        picture: getGamePicture(normalized),
      });
    });
  });

  return puzzles;
};

export const filterGamePuzzles = (
  puzzles: GamePuzzle[],
  stage: GameStageFilter,
  difficulty: GameDifficultyFilter,
): GamePuzzle[] =>
  puzzles.filter(
    (puzzle) =>
      (stage === 'all' || puzzle.stage === stage) &&
      (difficulty === 'all' || puzzle.difficulty === difficulty),
  );

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const pickRandomPuzzle = (
  pool: GamePuzzle[],
  solvedWordIds: ReadonlySet<string>,
  excludeId?: string,
): GamePuzzle | null => {
  if (pool.length === 0) return null;

  const unsolved = pool.filter(
    (puzzle) => !solvedWordIds.has(puzzle.id) && puzzle.id !== excludeId,
  );
  const fallback = pool.filter((puzzle) => puzzle.id !== excludeId);
  const candidates = unsolved.length > 0 ? unsolved : fallback.length > 0 ? fallback : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
};

/**
 * Show every letter that belongs to the answer plus a few distractors. This
 * keeps the game encouraging for beginners, gives the hint buttons something
 * useful to remove, and avoids a four-row wall of 26 keys on small phones.
 */
export const buildKeyboardLetters = (word: string): string[] => {
  const answerLetters = Array.from(new Set(Array.from(word.toUpperCase())));
  const distractors = shuffle(ALPHABET.filter((letter) => !answerLetters.includes(letter)));
  const targetCount = Math.min(18, Math.max(12, answerLetters.length + 6));
  return shuffle([...answerLetters, ...distractors.slice(0, targetCount - answerLetters.length)]);
};
