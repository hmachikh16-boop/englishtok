import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';

interface WordChoiceGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const WordChoiceGame: React.FC<WordChoiceGameProps> = ({ lessons, userProfile, onUpdateProfile }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).filter((puzzle) => puzzle.picture !== null), [lessons]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const current = puzzles.length ? puzzles[index % puzzles.length] : null;
  const options = useMemo(() => {
    if (!current) return [];
    const wrong = puzzles
      .filter((puzzle) => puzzle.id !== current.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((puzzle) => puzzle.translationAr);
    return [...wrong, current.translationAr].sort(() => Math.random() - 0.5);
  }, [current, puzzles]);

  if (!current) {
    return (
      <section className="games-choice-empty">
        <p>ستظهر الألغاز بعد تحميل المنهج.</p>
      </section>
    );
  }

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    const correct = option === current.translationAr;
    if (correct) {
      setScore((value) => value + 1);
      onUpdateProfile({ xp: userProfile.xp + 5 });
      speechService.playSuccessChime();
    } else {
      speechService.playErrorBuzz();
    }
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    setIndex((value) => value + 1);
  };

  return (
    <section className="games-choice" aria-label="لعبة اختيار الترجمة">
      <div className="games-choice-head">
        <div>
          <span className="games-kicker">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            لعبة جديدة
          </span>
          <h2 className="games-hero-title">اختر الترجمة الصحيحة</h2>
          <p className="games-hero-copy">اقرأ الكلمة الإنجليزية واختر معناها العربي. +5 XP لكل إجابة صحيحة.</p>
        </div>
        <div className="games-choice-score">
          <strong>{score}</strong>
          <span>نقاط</span>
        </div>
      </div>

      <div className="games-choice-card">
        <p className="games-choice-word" dir="ltr">{current.word.toLowerCase()}</p>
        {current.phonetic && <p className="games-choice-phonetic" dir="ltr">{current.phonetic}</p>}
        <div className="games-choice-options">
          {options.map((option) => {
            const isCorrect = option === current.translationAr;
            const isSelected = option === selected;
            return (
              <button
                key={option}
                type="button"
                disabled={answered}
                onClick={() => handleSelect(option)}
                className={`games-choice-option ${answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : ''}`}
              >
                {answered && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                {answered && isSelected && !isCorrect && <XCircle className="h-4 w-4" />}
                <span>{option}</span>
              </button>
            );
          })}
        </div>
        {answered && (
          <button type="button" className="games-choice-next" onClick={handleNext}>
            التالي
          </button>
        )}
      </div>
    </section>
  );
};