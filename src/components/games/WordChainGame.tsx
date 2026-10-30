import React, { useEffect, useMemo, useState } from 'react';
import { Check, Link2, RotateCcw, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { shuffle } from './gameUtils';
import type { GamePuzzle } from '../../services/gamePuzzles';

interface WordChainGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

interface ChainRound {
  current: GamePuzzle;
  options: GamePuzzle[];
  correctId: string;
}

const INITIAL_SIZE = 8;
const XP_PER_CORRECT = 5;

const buildChainRounds = (puzzles: GamePuzzle[], size: number): ChainRound[] => {
  const rounds: ChainRound[] = [];
  for (let index = 0; index < size; index += 1) {
    const current = shuffle(puzzles)[0];
    if (!current) continue;
    const last = current.word.slice(-1).toLowerCase();
    const candidates = puzzles.filter((puzzle) => puzzle.id !== current.id && puzzle.word.toLowerCase().startsWith(last));
    if (candidates.length === 0) continue;
    const correct = candidates[Math.floor(Math.random() * candidates.length)];
    const distractors = shuffle(puzzles.filter((puzzle) => puzzle.id !== current.id && puzzle.id !== correct.id)).slice(0, 3);
    rounds.push({ current, options: shuffle([correct, ...distractors]), correctId: correct.id });
  }
  return rounds;
};

export const WordChainGame: React.FC<WordChainGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState<ChainRound[]>(() => buildChainRounds(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const finished = queue.length > 0 && position >= queue.length;

  useEffect(() => { setSelected(null); setAnswered(false); }, [position]);

  if (puzzles.length < 8) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(buildChainRounds(puzzles, INITIAL_SIZE)); setPosition(0); setSelected(null); setAnswered(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'سلسلة قوية!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-word-chain', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleSelect = (item: GamePuzzle) => {
    if (answered) return;
    setSelected(item.id);
    setAnswered(true);
    setAnsweredCount((value) => value + 1);
    if (item.id === current.correctId) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 4) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 900);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={Link2} eyebrow="سلسلة" title="سلسلة كلمات" description="اختر الكلمة التي تبدأ بآخر حرف من الكلمة الحالية." onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="teal" footerNote="السلسلة (word chain) تدرّب الانتباه لبدايات/نهايات الكلمات وسرعة الاسترجاع.">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">ابدأ بآخر حرف</span>
            <h2 className="gg-word" dir="ltr">{current.current.word.toLowerCase()}</h2>
            <p className="gg-translation">{current.current.translationAr}</p>
            <p className="gg-chain-hint">آخر حرف: <strong dir="ltr">{current.current.word.slice(-1).toUpperCase()}</strong></p>
            <button type="button" className="gg-listen-chip" onClick={() => playWord(current.current.word)}><Link2 aria-hidden="true" /> استمع</button>
          </div>
          <div className="gg-options" role="group" aria-label="اختر الكلمة التالية">
            {current.options.map((item, index) => {
              const isCorrect = item.id === current.correctId;
              const isSelected = item.id === selected;
              const stateClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
              return (
                <button key={item.id} type="button" className={`gg-option ${stateClass}`} onClick={() => handleSelect(item)} disabled={answered}>
                  <span className="gg-option-key" aria-hidden="true">{answered && isCorrect ? <Check /> : answered && isSelected ? <X /> : index + 1}</span>
                  <span className="gg-option-value">
                    <span dir="ltr">{item.word.toLowerCase()}</span>
                    <span className="gg-option-translation">{item.translationAr}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
