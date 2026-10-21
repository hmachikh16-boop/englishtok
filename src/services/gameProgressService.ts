const GAME_PROGRESS_KEY = 'englishtok_game_progress_v1';
const MAX_REMEMBERED_WORDS = 3000;

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
    ? value.filter((item): item is string => typeof item === 'string' && item.length <= 120)
    : [];

export const loadGameProgress = (): GameProgress => {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = window.localStorage.getItem(GAME_PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      solvedWordIds: Array.from(new Set(stringArray(parsed.solvedWordIds))).slice(-MAX_REMEMBERED_WORDS),
      totalSolved: Math.max(0, Number(parsed.totalSolved) || 0),
      bestStreak: Math.max(0, Number(parsed.bestStreak) || 0),
      lastPlayedAt: typeof parsed.lastPlayedAt === 'string' ? parsed.lastPlayedAt : '',
    };
  } catch {
    return emptyProgress();
  }
};

export const saveGameProgress = (progress: GameProgress): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      GAME_PROGRESS_KEY,
      JSON.stringify({
        ...progress,
        solvedWordIds: Array.from(new Set(progress.solvedWordIds)).slice(-MAX_REMEMBERED_WORDS),
      }),
    );
  } catch {
    // A full or restricted localStorage should never interrupt the game.
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
