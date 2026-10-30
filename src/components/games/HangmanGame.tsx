import React, { useMemo, useState } from 'react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';

interface Props { lessons: Lesson[]; userProfile: UserProfile; onUpdateProfile: (u: Partial<UserProfile>) => void; }

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const HangmanGame: React.FC<Props> = ({ lessons, userProfile, onUpdateProfile }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).slice(0, 15), [lessons]);
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = puzzles.length ? puzzles[index % puzzles.length] : null;
  const word = current ? current.word : '';
  const maxWrong = 6;

  const isWin = word.split('').every((ch) => guessed.has(ch));
  const isLose = wrong >= maxWrong;

  const handleGuess = (letter: string) => {
    if (finished || guessed.has(letter)) return;
    const next = new Set(guessed);
    next.add(letter);
    setGuessed(next);
    if (!word.includes(letter)) {
      const w = wrong + 1;
      setWrong(w);
      if (w >= maxWrong) setFinished(true);
    } else if (word.split('').every((ch) => next.has(ch))) {
      setFinished(true);
      onUpdateProfile({ xp: userProfile.xp + 10 });
    }
  };

  const handleNext = () => {
    setGuessed(new Set());
    setWrong(0);
    setFinished(false);
    setIndex((i) => i + 1);
  };

  if (!current) return <p className="games-empty">ستظهر اللعبة بعد تحميل المنهج.</p>;

  return (
    <div className="hangman-game">
      <p className="hangman-hint">خمن الكلمة: {current.translationAr}</p>
      <p className="hangman-word">
        {word.split('').map((ch, i) => (
          <span key={i}>{guessed.has(ch) || finished ? ch : '_'}</span>
        )).join(' ')}
      </p>
      <p className="hangman-status">أخطاء: {wrong}/{maxWrong} {isWin && '— فزت!'} {isLose && '— خسرت!'}</p>
      <div className="hangman-keyboard">
        {ALPHABET.map((letter) => (
          <button key={letter} type="button" disabled={guessed.has(letter) || finished} onClick={() => handleGuess(letter)} className="hangman-key">
            {letter}
          </button>
        ))}
      </div>
      {finished && <button type="button" className="hangman-next" onClick={handleNext}>التالي</button>}
    </div>
  );
};