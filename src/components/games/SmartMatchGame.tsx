import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, HelpCircle, RotateCcw, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { shuffle } from './gameUtils';
import type { GamePuzzle } from '../../services/gamePuzzles';

interface SmartMatchGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

interface SmartRound {
  items: GamePuzzle[];
  oddId: string;
}

const INITIAL_SIZE = 8;
const XP_PER_CORRECT = 10;
const TIME_PER_QUESTION = 20;
const INITIAL_LIVES = 3;

const buildSmartRounds = (puzzles: GamePuzzle[], size: number): SmartRound[] => {
  const categories = [...new Set(puzzles.map((puzzle) => puzzle.category))];
  const rounds: SmartRound[] = [];
  for (let index = 0; index < size; index += 1) {
    if (categories.length < 2) break;
    const oddCategory = categories[Math.floor(Math.random() * categories.length)];
    const mainCandidates = categories.filter((category) => category !== oddCategory);
    const mainCategory = mainCandidates[Math.floor(Math.random() * mainCandidates.length)];
    const mainItems = shuffle(puzzles.filter((puzzle) => puzzle.category === mainCategory)).slice(0, 3);
    const oddItem = shuffle(puzzles.filter((puzzle) => puzzle.category === oddCategory))[0];
    if (mainItems.length < 3 || !oddItem) continue;
    rounds.push({ items: shuffle([...mainItems, oddItem]), oddId: oddItem.id });
  }
  return rounds;
};

const haptic = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
};

export const SmartMatchGame: React.FC<SmartMatchGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState<SmartRound[]>(() => buildSmartRounds(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const current = queue[position] ?? null;
  const finished = queue.length > 0 && (position >= queue.length || lives <= 0);

  const clearAdvance = () => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const advance = useCallback(() => {
    clearAdvance();
    setPosition((value) => value + 1);
  }, []);

  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setCorrect(null);
    setShakeId(null);
    setTimeLeft(TIME_PER_QUESTION);
  }, [position]);

  // countdown timer
  useEffect(() => {
    if (answered || finished || !current) return;
    if (timeLeft <= 0) {
      advance();
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timeLeft, answered, finished, current, advance]);

  useEffect(() => () => clearAdvance(), []);

  if (puzzles.length < 8) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult
          score={score}
          total={Math.max(1, answeredCount)}
          xp={xp}
          onReplay={() => {
            setQueue(buildSmartRounds(puzzles, INITIAL_SIZE));
            setPosition(0);
            setSelected(null);
            setAnswered(false);
            setCorrect(null);
            setScore(0);
            setXp(0);
            setLives(INITIAL_LIVES);
            setTimeLeft(TIME_PER_QUESTION);
            setAnsweredCount(0);
            setShakeId(null);
          }}
          onBack={onBack}
          title={score >= answeredCount * 0.7 ? 'ربط ذكي!' : 'واصل التدريب!'}
        />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const handleSelect = (item: GamePuzzle) => {
    if (answered) return;
    setSelected(item.id);
    setAnswered(true);
    setAnsweredCount((value) => value + 1);
    const isCorrect = item.id === current.oddId;
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore((value) => value + 10);
      setXp((value) => value + XP_PER_CORRECT);
      onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT });
      speechService.playSuccessChime();
      haptic(40);
    } else {
      setLives((value) => Math.max(0, value - 1));
      setShakeId(item.id);
      speechService.playErrorBuzz();
      haptic([30, 40, 30]);
    }
    advanceTimer.current = window.setTimeout(() => advance(), 1100);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame
        icon={HelpCircle}
        eyebrow="ربط ذكي"
        title="الربط الذكي"
        description="جد الكلمة الدخيلة (3 تنتمي لفئة، 1 دخيلة)."
        onBack={onBack}
        current={Math.min(position + 1, INITIAL_SIZE)}
        total={INITIAL_SIZE}
        score={score}
        accent="violet"
        footerNote="الربط الذكي يدرّب التصنيف والانتباه. 20 ثانية لكل سؤال."
      >
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">الوقت المتبقي: {timeLeft}s</span>
            <p className="gg-translation">المحاولات: {lives} · النقاط: {score}</p>
          </div>
          <div className="gg-options" role="group" aria-label="اختر الدخيلة">
            {current.items.map((item, index) => {
              const isCorrect = item.id === current.oddId;
              const isSelected = item.id === selected;
              const stateClass = answered
                ? isCorrect
                  ? 'is-correct'
                  : isSelected
                  ? 'is-wrong'
                  : ''
                : '';
              const shakeClass = shakeId === item.id ? 'is-shake' : '';
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`gg-option ${stateClass} ${shakeClass}`}
                  onClick={() => handleSelect(item)}
                  disabled={answered}
                >
                  <span className="gg-option-key" aria-hidden="true">
                    {answered && isCorrect ? <Check /> : answered && isSelected ? <X /> : index + 1}
                  </span>
                  <span className="gg-option-value">
                    <span dir="ltr">{item.word.toLowerCase()}</span>
                    <span className="gg-option-translation">{item.translationAr}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {answered && correct && (
            <p className="gg-smart-success">إجابة صحيحة!</p>
          )}
          {answered && correct === false && (
            <p className="gg-smart-error">إجابة خاطئة!</p>
          )}
        </section>
      </GameFrame>
    </div>
  );
};
