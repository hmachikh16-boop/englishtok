const GAME_PROGRESS_KEY = 'englishtok_game_progress_v1';
const MAX_REMEMBERED_WORDS = 3000;
const MAX_WORD_ID_LENGTH = 120;
const MAX_TOTAL_SOLVED = 100_000_000;
const MAX_BEST_STREAK = 100_000;

export interface GameProgress {
  solvedWordIds: string[];
  totalSolved: number;
  bestStreak: number;
  lastPlayedAt: string;
}

const emptyProgress = (): GameProgress => ({
  solvedWordIds: [],
  totalSolved: 0,
  bestStreak: 0,
  lastPlayedAt: '',
});

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length <= MAX_WORD_ID_LENGTH)
    : [];

export const loadGameProgress = (): GameProgress => {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = window.localStorage.getItem(GAME_PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      solvedWordIds: Array.from(new Set(stringArray(parsed.solvedWordIds))).slice(-MAX_REMEMBERED_WORDS),
      totalSolved: Math.max(0, Math.trunc(Number(parsed.totalSolved) || 0)),
      bestStreak: Math.max(0, Math.trunc(Number(parsed.bestStreak) || 0)),
      lastPlayedAt: typeof parsed.lastPlayedAt === 'string' ? parsed.lastPlayedAt : '',
    };
  } catch {
    return emptyProgress();
  }
};

/**
 * Strict validation for imported backups. Unlike loadGameProgress, malformed
 * values are rejected so a damaged file cannot silently erase game records.
 */
export const validateGameProgress = (value: unknown): GameProgress | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.solvedWordIds) || raw.solvedWordIds.length > MAX_REMEMBERED_WORDS) return null;
  if (!raw.solvedWordIds.every((item) => typeof item === 'string' && item.length > 0 && item.length <= MAX_WORD_ID_LENGTH)) {
    return null;
  }
  if (!Number.isSafeInteger(raw.totalSolved) || (raw.totalSolved as number) < 0 || (raw.totalSolved as number) > MAX_TOTAL_SOLVED) {
    return null;
  }
  if (!Number.isSafeInteger(raw.bestStreak) || (raw.bestStreak as number) < 0 || (raw.bestStreak as number) > MAX_BEST_STREAK) {
    return null;
  }
  if (typeof raw.lastPlayedAt !== 'string' || raw.lastPlayedAt.length > 80) return null;
  if (raw.lastPlayedAt && !Number.isFinite(Date.parse(raw.lastPlayedAt))) return null;

  return {
    solvedWordIds: Array.from(new Set(raw.solvedWordIds as string[])).slice(-MAX_REMEMBERED_WORDS),
    totalSolved: raw.totalSolved as number,
    bestStreak: raw.bestStreak as number,
    lastPlayedAt: raw.lastPlayedAt,
  };
};

export const saveGameProgress = (progress: GameProgress): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(
      GAME_PROGRESS_KEY,
      JSON.stringify({
        ...progress,
        solvedWordIds: Array.from(new Set(progress.solvedWordIds)).slice(-MAX_REMEMBERED_WORDS),
      }),
    );
    return true;
  } catch {
    // A full or restricted localStorage should never interrupt the game.
    return false;
  }
};

export const resetGameProgress = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(GAME_PROGRESS_KEY);
  } catch {
    // Ignore storage restrictions while resetting.
  }
};
