import React, { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, shuffle } from './gameUtils';

interface PhoneticMatchGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 10;
const XP_PER_CORRECT = 4;

export const PhoneticMatchGame: React.FC<PhoneticMatchGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).filter((puzzle) => (puzzle.phonetic || '').trim().length > 0), [lessons]);
  const [queue, setQueue] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const finished = queue.length > 0 && position >= queue.length;

  const options = useMemo(() => {
    if (!current) return [];
    const pool = puzzles.filter((puzzle) => puzzle.id !== current.id && (puzzle.phonetic || '').trim().length > 0);
    const distractors = shuffle(pool).slice(0, 3).map((puzzle) => puzzle.phonetic);
    return shuffle([current.phonetic, ...distractors]);
  }, [current, puzzles]);

  useEffect(() => { setSelected(null); setAnswered(false); }, [current?.id, position]);

  if (puzzles.length < 4) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(buildRound(puzzles, INITIAL_SIZE)); setPosition(0); setSelected(null); setAnswered(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'نطق دقيق!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-phonetic', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    setAnsweredCount((value) => value + 1);
    if (option === current.phonetic) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 5) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 900);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={Volume2} eyebrow="نطق" title="طابق النطق" description="اختر التهجئة الصوتية (IPA) الصحيحة للكلمة." onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="blue" footerNote="الربط بين الكلمة وتهجئتها الصوتية يحسّن النطق والاستماع.">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">أي نطق صحيح؟</span>
            <h2 className="gg-word" dir="ltr">{current.word.toLowerCase()}</h2>
            <p className="gg-translation">{current.translationAr}</p>
            <button type="button" className="gg-listen-chip" onClick={() => playWord(current.word)}><Volume2 aria-hidden="true" /> استمع</button>
          </div>
          <div className="gg-options" role="group" aria-label="اختر النطق">
            {options.map((option, index) => {
              const isCorrect = option === current.phonetic;
              const isSelected = option === selected;
              const stateClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
              return (
                <button key={`${option}-${index}`} type="button" className={`gg-option ${stateClass}`} onClick={() => handleSelect(option)} disabled={answered}>
                  <span className="gg-option-key" aria-hidden="true">{answered && isCorrect ? <Check /> : answered && isSelected ? <X /> : index + 1}</span>
                  <span className="gg-option-value" dir="ltr">{option}</span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
