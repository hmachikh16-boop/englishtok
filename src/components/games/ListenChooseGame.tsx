import React, { useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';

interface Props { lessons: Lesson[]; userProfile: UserProfile; onUpdateProfile: (u: Partial<UserProfile>) => void; }

export const ListenChooseGame: React.FC<Props> = ({ lessons, userProfile, onUpdateProfile }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).slice(0, 20), [lessons]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const current = puzzles.length ? puzzles[index % puzzles.length] : null;
  const options = useMemo(() => {
    if (!current) return [];
    const wrong = puzzles.filter((p) => p.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p.word.toLowerCase());
    return [...wrong, current.word.toLowerCase()].sort(() => Math.random() - 0.5);
  }, [current, puzzles]);

  const play = () => {
    if (!current) return;
    speechService.speakText({ source: 'games', text: current.word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });
  };

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
    <div className="listen-game">
      <div className="listen-head">
        <p>استمع واختر الكلمة الصحيحة</p>
        <strong>{score} نقاط</strong>
      </div>
      <button type="button" className="listen-play" onClick={play}>
        <Volume2 className="h-5 w-5" /> تشغيل
      </button>
      <div className="listen-options">
        {options.map((opt) => {
          const correct = opt === current.word.toLowerCase();
          const sel = opt === selected;
          return (
            <button key={opt} type="button" disabled={answered} onClick={() => handleSelect(opt)} className={`listen-option ${answered ? (correct ? 'is-correct' : sel ? 'is-wrong' : '') : ''}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && <button type="button" className="listen-next" onClick={() => { setSelected(null); setAnswered(false); setIndex((i) => i + 1); }}>التالي</button>}
    </div>
  );
};