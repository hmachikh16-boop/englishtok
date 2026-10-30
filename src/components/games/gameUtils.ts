import type { GamePuzzle } from '../../services/gamePuzzles';

export const shuffle = <T,>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export const buildRound = (puzzles: GamePuzzle[], size = 10): GamePuzzle[] =>
  shuffle(puzzles).slice(0, Math.min(size, puzzles.length));

export type GameOptionField = 'word' | 'translationAr';

/**
 * Builds a set of plausible distractors from the same category first, then
 * from the rest of the curriculum. Values are de-duplicated so a player never
 * sees the same choice twice in one question.
 */
export const buildGameOptions = (
  pool: GamePuzzle[],
  current: GamePuzzle,
  field: GameOptionField,
  count = 4,
  preferSamePartOfSpeech = false,
): string[] => {
  const valueOf = (puzzle: GamePuzzle) =>
    field === 'word' ? puzzle.word.toLowerCase() : puzzle.translationAr;
  const correct = valueOf(current);
  const seen = new Set([correct.trim().toLowerCase()]);
  const isPreferred = (puzzle: GamePuzzle) =>
    puzzle.category === current.category &&
    (!preferSamePartOfSpeech || puzzle.partOfSpeech === current.partOfSpeech);
  const preferred = shuffle(pool.filter((puzzle) => puzzle.id !== current.id && isPreferred(puzzle)));
  const rest = shuffle(pool.filter((puzzle) => puzzle.id !== current.id && !isPreferred(puzzle)));
  const options: string[] = [];

  for (const puzzle of [...preferred, ...rest]) {
    const value = valueOf(puzzle);
    const key = value.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(value);
    if (options.length >= count - 1) break;
  }

  return shuffle([correct, ...options]);
};

export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const percent = (value: number, total: number): number =>
  total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;

export const targetLanguageLabel = (targetLanguage?: string): string =>
  targetLanguage === 'fr' ? 'الفرنسية' : 'الإنجليزية';
