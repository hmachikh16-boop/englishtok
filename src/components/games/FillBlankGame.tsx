import React, { useMemo, useState } from 'react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';

interface Props { lessons: Lesson[]; userProfile: UserProfile; onUpdateProfile: (u: Partial<UserProfile>) => void; }

export const FillBlankGame: React.FC<Props> = ({ lessons, userProfile, onUpdateProfile }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).filter((p) => p.exampleSentence).slice(0, 20), [lessons]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const current = puzzles.length ? puzzles[index % puzzles.length] : null;
  const sentence = current ? current.exampleSentence.replace(new RegExp(current.word, 'i'), '_____') : '';
  const options = useMemo(() => {
    if (!current) return [];
    const wrong = puzzles.filter((p) => p.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p.word.toLowerCase());
    return [...wrong, current.word.toLowerCase()].sort(() => Math.random() - 0.5);
  }, [current, puzzles]);

  if (!current) return <p className="games-empty">ستظهر اللعبة بعد تحميل المنهج.</p>;

  const handleSelect = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === current.word.toLowerCase()) {
      setScore((s) => s + 1);
      onUpdateProfile({ xp: userProfile.xp + 5 });
    }
  };

  return (
    <div className="fill-game">
      <div className="fill-head">
        <p>أكمل الجملة بالكلمة الصحيحة</p>
        <strong>{score} نقاط</strong>
      </div>
      <p className="fill-sentence" dir="ltr">{sentence}</p>
      <p className="fill-translation">{current.exampleSentenceAr}</p>
      <div className="fill-options">
        {options.map((opt) => {
          const correct = opt === current.word.toLowerCase();
          const sel = opt === selected;
          return (
            <button key={opt} type="button" disabled={answered} onClick={() => handleSelect(opt)} className={`fill-option ${answered ? (correct ? 'is-correct' : sel ? 'is-wrong' : '') : ''}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && <button type="button" className="fill-next" onClick={() => { setSelected(null); setAnswered(false); setIndex((i) => i + 1); }}>التالي</button>}
    </div>
  );
};