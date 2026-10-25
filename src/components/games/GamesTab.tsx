import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Delete,
  Flame,
  Gamepad2,
  Lightbulb,
  RotateCcw,
  SkipForward,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { speechService } from '../../services/speechService';
import {
  buildGamePuzzles,
  buildKeyboardLetters,
  filterGamePuzzles,
  GAME_DIFFICULTIES,
  GAME_STAGES,
  pickRandomPuzzle,
  type GameDifficulty,
  type GameDifficultyFilter,
  type GamePuzzle,
  type GameStageFilter,
} from '../../services/gamePuzzles';
import {
  loadGameProgress,
  resetGameProgress,
  saveGameProgress,
  type GameProgress,
} from '../../services/gameProgressService';
import { GamePictureClue } from './GamePictureClue';

interface GamesTabProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const XP_BY_DIFFICULTY: Record<GameDifficulty, number> = {
  easy: 5,
  medium: 8,
  hard: 12,
};

const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'متقدم',
};

const MAX_REVEAL_HINTS = 3;
const MAX_REMOVE_HINTS = 2;
const MAX_REMEMBERED_WORDS = 3000;

const usedLetterCounts = (letters: string[]): Record<string, number> =>
  letters.reduce<Record<string, number>>((counts, letter) => {
    if (letter) counts[letter] = (counts[letter] ?? 0) + 1;
    return counts;
  }, {});

const letterCountsForWord = (word: string): Record<string, number> =>
  usedLetterCounts(word.split(''));

export const GamesTab: React.FC<GamesTabProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
}) => {
  const [gameProgress, setGameProgress] = useState<GameProgress>(() => loadGameProgress());
  const solvedWordIdsRef = useRef<Set<string>>(new Set(gameProgress.solvedWordIds));
  const [stageFilter, setStageFilter] = useState<GameStageFilter>(1);
  const [difficultyFilter, setDifficultyFilter] = useState<GameDifficultyFilter>('easy');
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
  const [filled, setFilled] = useState<string[]>([]);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);
  const [hiddenLetters, setHiddenLetters] = useState<string[]>([]);
  const [revealHintsUsed, setRevealHintsUsed] = useState(0);
  const [removeHintsUsed, setRemoveHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<'playing' | 'solved'>('playing');
  const [errorPulse, setErrorPulse] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sessionSolved, setSessionSolved] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintClickAtRef = useRef(0);

  const puzzles = useMemo(
    () => buildGamePuzzles(lessons).filter((puzzle) => puzzle.picture !== null),
    [lessons],
  );
  const filteredPuzzles = useMemo(
    () => filterGamePuzzles(puzzles, stageFilter, difficultyFilter),
    [puzzles, stageFilter, difficultyFilter],
  );
  const currentPuzzle = useMemo<GamePuzzle | null>(() => {
    if (filteredPuzzles.length === 0) return null;
    return (
      filteredPuzzles.find((puzzle) => puzzle.id === currentPuzzleId) ??
      filteredPuzzles[0] ??
      null
    );
  }, [filteredPuzzles, currentPuzzleId]);
  const keyboardLetters = useMemo(
    () => (currentPuzzle ? buildKeyboardLetters(currentPuzzle.word) : []),
    [currentPuzzle],
  );
  const solvedWordIds = useMemo(
    () => new Set(gameProgress.solvedWordIds),
    [gameProgress.solvedWordIds],
  );
  const solvedInFilter = useMemo(
    () => filteredPuzzles.filter((puzzle) => solvedWordIds.has(puzzle.id)).length,
    [filteredPuzzles, solvedWordIds],
  );

  useEffect(() => {
    solvedWordIdsRef.current = new Set(gameProgress.solvedWordIds);
  }, [gameProgress.solvedWordIds]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    setRoundComplete(false);
    if (filteredPuzzles.length === 0) {
      setCurrentPuzzleId(null);
      return;
    }
    setCurrentPuzzleId((previous) => {
      if (previous && filteredPuzzles.some((puzzle) => puzzle.id === previous)) {
        return previous;
      }
      return pickRandomPuzzle(filteredPuzzles, solvedWordIdsRef.current)?.id ?? filteredPuzzles[0].id;
    });
  }, [filteredPuzzles]);

  useEffect(() => {
    if (!currentPuzzle) {
      setFilled([]);
      return;
    }
    setFilled(Array(currentPuzzle.word.length).fill(''));
    setRevealedPositions([]);
    setHiddenLetters([]);
    setRevealHintsUsed(0);
    setRemoveHintsUsed(0);
    setMistakes(0);
    setStatus('playing');
    setErrorPulse(false);
  }, [currentPuzzle?.id]);

  const playWord = (word: string) => {
    speechService.speakText({
      source: 'games',
      text: word.toLowerCase(),
      rate: 0.9,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const handleLetter = (letter: string) => {
    if (!currentPuzzle || status !== 'playing' || errorPulse) return;
    const next = [...filled];
    while (next.length < currentPuzzle.word.length) next.push('');
    const emptyIndex = next.findIndex((value) => !value);
    if (emptyIndex === -1) return;
    next[emptyIndex] = letter;
    setFilled(next);
    speechService.playPop();
  };

  const handleBackspace = () => {
    if (!currentPuzzle || status !== 'playing' || errorPulse) return;
    const next = [...filled];
    for (let index = next.length - 1; index >= 0; index -= 1) {
      if (next[index] && !revealedPositions.includes(index)) {
        next[index] = '';
        break;
      }
    }
    setFilled(next);
    speechService.playPop();
  };

  const acceptHintClick = (): boolean => {
    const now = Date.now();
    if (now - hintClickAtRef.current < 220) return false;
    hintClickAtRef.current = now;
    return true;
  };

  const handleRevealHint = () => {
    if (!currentPuzzle || status !== 'playing' || !acceptHintClick()) return;
    if (revealHintsUsed >= MAX_REVEAL_HINTS) {
      showToast('استخدمت كل تلميحات كشف الحروف لهذه الكلمة.');
      return;
    }
    const candidates = currentPuzzle.word
      .split('')
      .map((_letter, index) => index)
      .filter((index) => filled[index] !== currentPuzzle.word[index]);
    if (candidates.length === 0) {
      showToast('كل حروف الكلمة ظاهرة بالفعل.');
      return;
    }

    const position = candidates[Math.floor(Math.random() * candidates.length)];
    const next = [...filled];
    while (next.length < currentPuzzle.word.length) next.push('');
    next[position] = currentPuzzle.word[position];
    setFilled(next);
    setRevealedPositions((previous) =>
      previous.includes(position) ? previous : [...previous, position],
    );
    setRevealHintsUsed((previous) => previous + 1);
    showToast(`تم كشف الحرف ${currentPuzzle.word[position]} في الموضع ${position + 1}.`);
    speechService.playPop();
  };

  const handleRemoveHint = () => {
    if (!currentPuzzle || status !== 'playing' || !acceptHintClick()) return;
    if (removeHintsUsed >= MAX_REMOVE_HINTS) {
      showToast('استخدمت كل تلميحات إخفاء الحروف لهذه الكلمة.');
      return;
    }
    const answerLetters = new Set(currentPuzzle.word.split(''));
    const candidates = keyboardLetters.filter(
      (letter) => !answerLetters.has(letter) && !hiddenLetters.includes(letter),
    );
    if (candidates.length === 0) {
      showToast('لا توجد حروف إضافية يمكن إخفاؤها.');
      return;
    }

    const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 3);
    setHiddenLetters((previous) => [...previous, ...shuffled]);
    setRemoveHintsUsed((previous) => previous + 1);
    showToast('أُخفيت ثلاثة حروف غير موجودة في الكلمة.');
    speechService.playPop();
  };

  const chooseNextPuzzle = (skipCurrent: boolean) => {
    if (!currentPuzzle) return;
    const next = pickRandomPuzzle(
      filteredPuzzles,
      solvedWordIdsRef.current,
      skipCurrent ? currentPuzzle.id : undefined,
    );
    if (!next) {
      setRoundComplete(true);
      showToast('أكملت كل الألغاز المتاحة في هذا الاختيار.');
      return;
    }
    if (skipCurrent) setStreak(0);
    setCurrentPuzzleId(next.id);
    setRoundComplete(false);
  };

  useEffect(() => {
    if (!currentPuzzle || status !== 'playing' || errorPulse) return;
    const word = currentPuzzle.word;
    if (filled.length !== word.length || filled.some((letter) => !letter)) return;

    if (filled.join('') === word) {
      setStatus('solved');
      speechService.playSuccessChime();
      const reward = XP_BY_DIFFICULTY[currentPuzzle.difficulty];
      onUpdateProfile({ xp: userProfile.xp + reward });
      const nextProgress: GameProgress = {
        solvedWordIds: Array.from(
          new Set([...gameProgress.solvedWordIds, currentPuzzle.id]),
        ).slice(-MAX_REMEMBERED_WORDS),
        totalSolved: gameProgress.totalSolved + 1,
        bestStreak: Math.max(gameProgress.bestStreak, streak + 1),
        lastPlayedAt: new Date().toISOString(),
      };
      setGameProgress(nextProgress);
      saveGameProgress(nextProgress);
      solvedWordIdsRef.current = new Set(nextProgress.solvedWordIds);
      setStreak((previous) => previous + 1);
      setSessionSolved((previous) => previous + 1);
      return;
    }

    setErrorPulse(true);
    setMistakes((previous) => previous + 1);
    speechService.playErrorBuzz();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setFilled((previous) =>
        previous.map((letter, index) =>
          revealedPositions.includes(index) ? previous[index] : '',
        ),
      );
      setErrorPulse(false);
    }, 750);
  }, [
    currentPuzzle,
    filled,
    status,
    errorPulse,
    onUpdateProfile,
    userProfile.xp,
    gameProgress,
    streak,
    revealedPositions,
  ]);

  const handleResetGame = () => {
    if (!window.confirm('سيتم حذف عدد الكلمات المحلولة وسلسلة اللعب فقط، دون المساس بتقدم الدروس. هل تريد المتابعة؟')) {
      return;
    }
    resetGameProgress();
    const fresh = loadGameProgress();
    setGameProgress(fresh);
    solvedWordIdsRef.current = new Set();
    setStreak(0);
    setSessionSolved(0);
    setRoundComplete(false);
    const next = pickRandomPuzzle(filteredPuzzles, new Set());
    setCurrentPuzzleId(next?.id ?? null);
    showToast('تمت إعادة ضبط إحصاءات اللعبة.');
  };

  const wordLetterCounts = currentPuzzle ? letterCountsForWord(currentPuzzle.word) : {};
  const filledLetterCounts = usedLetterCounts(filled);
  const reward = currentPuzzle ? XP_BY_DIFFICULTY[currentPuzzle.difficulty] : 0;

  return (
    <div className="journey-home games-page flex-1 min-h-0 overflow-y-auto" dir="rtl">
      <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
        <section className="games-hero">
          <div className="games-hero-glow games-hero-glow-a" aria-hidden="true" />
          <div className="games-hero-glow games-hero-glow-b" aria-hidden="true" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <span className="games-kicker">
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                تحدي الكلمات
              </span>
              <h1 className="games-hero-title">رتّب الحروف واكسب XP</h1>
              <p className="games-hero-copy">
                {puzzles.length.toLocaleString('en-US')} لغز مصوّر من مفردات المنهج، مع
                تلميحات ونطق صوتي لكل كلمة.
              </p>
            </div>
            <span className="games-hero-mascot" aria-hidden="true">
              <Gamepad2 className="h-9 w-9" />
            </span>
          </div>

          <div className="games-stats">
            <div className="games-stat">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              <strong>{gameProgress.totalSolved.toLocaleString('en-US')}</strong>
              <span>كلمة محلولة</span>
            </div>
            <div className="games-stat">
              <Flame className="h-4 w-4" aria-hidden="true" />
              <strong>{streak}</strong>
              <span>سلسلة الآن</span>
            </div>
            <div className="games-stat">
              <Star className="h-4 w-4" aria-hidden="true" />
              <strong>{userProfile.xp.toLocaleString('en-US')}</strong>
              <span>مجموع XP</span>
            </div>
          </div>
        </section>

        <section className="games-filters" aria-label="تصفية الألغاز">
          <div className="games-filter-row">
            <span className="games-filter-label">المرحلة</span>
            <div className="games-chip-scroll">
              {GAME_STAGES.map((stage) => (
                <button
                  key={String(stage.value)}
                  type="button"
                  onClick={() => setStageFilter(stage.value)}
                  className={`games-chip ${stageFilter === stage.value ? 'is-active' : ''}`}
                  aria-pressed={stageFilter === stage.value}
                >
                  {stage.labelAr}
                </button>
              ))}
            </div>
          </div>
          <div className="games-filter-row">
            <span className="games-filter-label">الصعوبة</span>
            <div className="games-chip-scroll">
              {GAME_DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty.value}
                  type="button"
                  onClick={() => setDifficultyFilter(difficulty.value)}
                  className={`games-chip ${difficultyFilter === difficulty.value ? 'is-active' : ''}`}
                  aria-pressed={difficultyFilter === difficulty.value}
                  title={difficulty.labelAr}
                >
                  {difficulty.shortLabelAr}
                </button>
              ))}
            </div>
          </div>
        </section>

        {roundComplete ? (
          <section className="games-card games-complete" role="status">
            <div className="games-complete-icon">
              <Trophy className="h-10 w-10" aria-hidden="true" />
            </div>
            <h2>أكملت كل الألغاز في هذا الاختيار!</h2>
            <p>
              حللت {solvedInFilter.toLocaleString('en-US')} كلمة من {filteredPuzzles.length.toLocaleString('en-US')}.
              جرّب مرحلة أو مستوى صعوبة آخر، أو ابدأ جولة جديدة.
            </p>
            <button
              type="button"
              className="games-primary-btn"
              onClick={() => {
                const next = pickRandomPuzzle(filteredPuzzles, new Set());
                setCurrentPuzzleId(next?.id ?? null);
                setRoundComplete(false);
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              ابدأ جولة جديدة
            </button>
          </section>
        ) : !currentPuzzle ? (
          <section className="games-card games-empty">
            <div className="games-empty-icon">
              <Gamepad2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2>لا توجد ألغاز بهذه التصفية</h2>
            <p>اختر مرحلة أو مستوى صعوبة آخر لبدء اللعب.</p>
          </section>
        ) : status === 'solved' ? (
          <section className="games-card games-success" role="status" aria-live="polite">
            <div className="games-success-icon">
              <Check className="h-9 w-9" aria-hidden="true" />
            </div>
            <span className="games-success-kicker">إجابة صحيحة</span>
            <h2 dir="ltr" className="games-success-word">
              {currentPuzzle.word}
            </h2>
            <div className="games-success-meta">
              {currentPuzzle.phonetic && <span dir="ltr">{currentPuzzle.phonetic}</span>}
              <span>{currentPuzzle.partOfSpeech}</span>
              <span>{currentPuzzle.translationAr}</span>
            </div>
            <div className="games-example">
              <p dir="ltr">{currentPuzzle.exampleSentence}</p>
              <p>{currentPuzzle.exampleSentenceAr}</p>
            </div>
            <span className="games-reward">
              <Star className="h-4 w-4" aria-hidden="true" />
              +{reward} XP
            </span>
            <div className="games-success-actions">
              <button
                type="button"
                className="games-secondary-btn"
                onClick={() => playWord(currentPuzzle.word)}
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                سماع النطق
              </button>
              <button
                type="button"
                className="games-primary-btn"
                onClick={() => chooseNextPuzzle(false)}
              >
                الكلمة التالية
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : (
          <section className={`games-card ${errorPulse ? 'games-shake' : ''}`} aria-live="polite">
            <div className="games-card-top">
              <span className={`games-difficulty is-${currentPuzzle.difficulty}`}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {DIFFICULTY_LABELS[currentPuzzle.difficulty]}
              </span>
              <span className="games-lesson-label">
                {currentPuzzle.lessonTitleAr}
              </span>
            </div>

            {currentPuzzle.picture && (
              <GamePictureClue
                picture={currentPuzzle.picture}
                translationAr={currentPuzzle.translationAr}
                category={currentPuzzle.category}
              />
            )}

            <div className="games-clue">
              <span className="games-clue-label">اكتب الكلمة {userProfile.targetLanguage === 'fr' ? 'الفرنسية' : 'الإنجليزية'} للصورة</span>
              <h2>{currentPuzzle.translationAr}</h2>
              <div className="games-clue-meta">
                <span>{currentPuzzle.partOfSpeech}</span>
                {currentPuzzle.phonetic && <span dir="ltr">{currentPuzzle.phonetic}</span>}
              </div>
            </div>

            <div className="games-slots" dir="ltr" aria-label="خانات حروف الكلمة">
              {Array.from({ length: currentPuzzle.word.length }).map((_value, index) => (
                <span
                  key={`${currentPuzzle.id}-slot-${index}`}
                  className={`games-slot ${filled[index] ? 'is-filled' : ''} ${
                    revealedPositions.includes(index) ? 'is-revealed' : ''
                  } ${errorPulse ? 'is-error' : ''}`}
                  aria-label={
                    filled[index] ? `الحرف ${filled[index]}` : `الخانة ${index + 1} فارغة`
                  }
                >
                  {filled[index] ?? ''}
                </span>
              ))}
            </div>

            <div className="games-hint-row">
              <button
                type="button"
                className="games-hint-btn"
                onClick={handleRevealHint}
                disabled={revealHintsUsed >= MAX_REVEAL_HINTS}
              >
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                كشف حرف
                <b>{MAX_REVEAL_HINTS - revealHintsUsed}</b>
              </button>
              <button
                type="button"
                className="games-hint-btn"
                onClick={handleRemoveHint}
                disabled={removeHintsUsed >= MAX_REMOVE_HINTS}
              >
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
                إخفاء 3
                <b>{MAX_REMOVE_HINTS - removeHintsUsed}</b>
              </button>
              <button
                type="button"
                className="games-hint-btn"
                onClick={() => playWord(currentPuzzle.word)}
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                سماع
              </button>
            </div>

            <div className="games-keyboard" dir="ltr" aria-label={`لوحة الحروف ${userProfile.targetLanguage === 'fr' ? 'الفرنسية' : 'الإنجليزية'}`}>
              {keyboardLetters.map((letter) => {
                const hidden = hiddenLetters.includes(letter);
                const exhausted =
                  (wordLetterCounts[letter] ?? 0) > 0 &&
                  (filledLetterCounts[letter] ?? 0) >= (wordLetterCounts[letter] ?? 0);
                return (
                  <button
                    key={letter}
                    type="button"
                    className={`games-key ${hidden ? 'is-hidden' : ''}`}
                    onClick={() => handleLetter(letter)}
                    disabled={hidden || exhausted || errorPulse}
                    aria-hidden={hidden}
                    tabIndex={hidden ? -1 : undefined}
                    aria-label={`الحرف ${letter}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <div className="games-play-actions">
              <button type="button" className="games-utility-btn" onClick={handleBackspace}>
                <Delete className="h-4 w-4" aria-hidden="true" />
                مسح
              </button>
              <span className="games-attempts">
                {mistakes > 0 ? `محاولات خاطئة: ${mistakes}` : 'اختر الحروف بالترتيب'}
              </span>
              <button
                type="button"
                className="games-utility-btn"
                onClick={() => chooseNextPuzzle(true)}
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                كلمة أخرى
              </button>
            </div>
          </section>
        )}

        <section className="games-footnote">
          <div className="games-footnote-copy">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            <p>
              كل كلمة مأخوذة من دروس المنهج. لا توجد خسارة عند الخطأ؛ استخدم التلميحات
              أو استمع للنطق ثم حاول مجددًا.
            </p>
          </div>
          <div className="games-footnote-stats">
            <span>
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              أفضل سلسلة: {gameProgress.bestStreak}
            </span>
            <span>
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              جلسة اليوم: {sessionSolved}
            </span>
          </div>
          <p className="games-credit">
            الرسوم الكرتونية:{' '}
            <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">
              Twemoji
            </a>{' '}
            · CC BY 4.0
          </p>
          <button type="button" className="games-reset-btn" onClick={handleResetGame}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            إعادة ضبط إحصاءات اللعبة
          </button>
        </section>
      </div>

      {toast && (
        <div className="games-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
};
