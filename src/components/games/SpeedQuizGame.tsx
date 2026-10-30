import React, { useEffect, useMemo, useState } from 'react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';

interface Props { lessons: Lesson[]; userProfile: UserProfile; onUpdateProfile: (u: Partial<UserProfile>) => void; }

export const SpeedQuizGame: React.FC<Props> = ({ lessons, userProfile, onUpdateProfile }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).slice(0, 10), [lessons]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = puzzles.length ? puzzles[index] : null;
  const options = useMemo(() => {
    if (!current) return [];
    const wrong = puzzles.filter((p) => p.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p.translationAr);
    return [...wrong, current.translationAr].sort(() => Math.random() - 0.5);
  }, [current, puzzles]);

  useEffect(() => {
    if (finished || answered || !current) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [timeLeft, finished, answered, current]);

  if (!current && !finished) return <p className="games-empty">ستظهر اللعبة بعد تحميل المنهج.</p>;

  if (finished) {
    return (
      <div className="speed-game">
        <h3>انتهى الوقت!</h3>
        <p>النتيجة: {score}/{puzzles.length}</p>
        <button type="button" className="speed-restart" onClick={() => { setIndex(0); setScore(0); setTimeLeft(10); setSelected(null); setAnswered(false); setFinished(false); }}>إعادة</button>
      </div>
    );
  }

  const handleSelect = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === current!.translationAr) {
      setScore((s) => s + 1);
      onUpdateProfile({ xp: userProfile.xp + 5 });
    }
  };

  const handleNext = () => {
    if (index + 1 >= puzzles.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setTimeLeft(10);
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div className="speed-game">
      <div className="speed-head">
        <p>لعبة سريعة (10 ثوانٍ)</p>
        <strong>{timeLeft}s</strong>
        <span>{score} نقاط</span>
      </div>
      <p className="speed-word" dir="ltr">{current!.word.toLowerCase()}</p>
      <div className="speed-options">
        {options.map((opt) => {
          const correct = opt === current!.translationAr;
          const sel = opt === selected;
          return (
            <button key={opt} type="button" disabled={answered} onClick={() => handleSelect(opt)} className={`speed-option ${answered ? (correct ? 'is-correct' : sel ? 'is-wrong' : '') : ''}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && <button type="button" className="speed-next" onClick={handleNext}>التالي</button>}
    </div>
  );
};