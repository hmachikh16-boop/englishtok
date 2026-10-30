import React, { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Shuffle, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, shuffle, targetLanguageLabel } from './gameUtils';

interface WordScrambleGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 10;
const XP_PER_CORRECT = 4;

export const WordScrambleGame: React.FC<WordScrambleGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState<string[]>([]);
  const [used, setUsed] = useState<boolean[]>([]);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [locked, setLocked] = useState(false);

  const current = queue[position] ?? null;
  const language = targetLanguageLabel(userProfile.targetLanguage);
  const finished = queue.length > 0 && position >= queue.length;

  useEffect(() => {
    if (!current) return;
    const letters = shuffle(current.word.split(''));
    setScrambled(letters);
    setInput([]);
    setUsed(Array(letters.length).fill(false));
    setLocked(false);
  }, [current?.id, position]);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;

  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answered)} xp={xp} onReplay={() => {
          setQueue(buildRound(puzzles, INITIAL_SIZE)); setPosition(0); setInput([]); setUsed([]); setScrambled([]); setScore(0); setXp(0); setAnswered(0); setLocked(false);
        }} onBack={onBack} title={score >= answered * 0.7 ? 'تهجئة ممتازة!' : 'واصل التدريب!'} />
      </div>
    );
  }

  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-scramble', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleLetter = (index: number) => {
    if (locked || used[index]) return;
    const letter = scrambled[index];
    const nextUsed = [...used]; nextUsed[index] = true;
    const nextInput = [...input, letter];
    setUsed(nextUsed); setInput(nextInput);
    speechService.playPop();
    if (nextInput.length === current.word.length) {
      setLocked(true);
      const guess = nextInput.join('');
      setAnswered((value) => value + 1);
      if (guess.toLowerCase() === current.word.toLowerCase()) {
        setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
      } else {
        if (queue.length < INITIAL_SIZE + 5) setQueue((items) => [...items, current]);
        speechService.playErrorBuzz();
      }
      setTimeout(() => setPosition((value) => value + 1), 900);
    }
  };

  const handleBackspace = () => {
    if (locked || input.length === 0) return;
    const last = input.length - 1;
    const letter = input[last];
    // mark the last used occurrence as unused
    const usedIndex = scrambled.map((l, i) => (l === letter && used[i]) ? i : -1).filter((i) => i >= 0).pop();
    const nextUsed = [...used];
    if (typeof usedIndex === 'number' && usedIndex >= 0) nextUsed[usedIndex] = false;
    setUsed(nextUsed); setInput((value) => value.slice(0, -1)); speechService.playPop();
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={Shuffle} eyebrow="تحدي التهجئة" title="خلط الحروف" description={`أعد ترتيب الحروف لتكوين الكلمة ${language}.`} onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="gold" footerNote="الخلط يدرّب التعرف على أنماط الحروف. استخدم 'مسح' لإعادة المحاولة قبل التحقق.">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">رتّب الحروف</span>
            <p className="gg-translation">{current.translationAr}</p>
            <div className="gg-scramble-slots" aria-label="الكلمة المُركّبة">
              {Array.from({ length: current.word.length }).map((_, i) => (
                <span key={i} className={`gg-hangman-letter ${input[i] ? 'is-revealed' : ''}`}>{input[i] ?? ''}</span>
              ))}
            </div>
          </div>
          <div className="gg-scramble-keyboard" aria-label="حروف مخلوطة">
            {scrambled.map((letter, index) => (
              <button key={`${letter}-${index}`} type="button" className={`gg-hangman-key ${used[index] ? 'is-wrong' : ''}`} onClick={() => handleLetter(index)} disabled={used[index] || locked}>{letter}</button>
            ))}
          </div>
          <div className="gg-feedback-actions">
            <button type="button" className="gg-soft-btn" onClick={handleBackspace} disabled={locked || input.length === 0}>مسح</button>
            <button type="button" className="gg-soft-btn" onClick={() => playWord(current.word)}><Volume2 aria-hidden="true" /> استمع</button>
          </div>
          {locked && (
            <div className={`gg-feedback ${input.join('').toLowerCase() === current.word.toLowerCase() ? 'is-correct' : 'is-wrong'}`} role="status">
              <span className="gg-feedback-mark">{input.join('').toLowerCase() === current.word.toLowerCase() ? <Check /> : <X />}</span>
              <div className="gg-feedback-copy">
                <strong>{input.join('').toLowerCase() === current.word.toLowerCase() ? 'أحسنت!' : 'ليست الكلمة الصحيحة'}</strong>
                <p className="gg-feedback-answer" dir="ltr">{current.word}</p>
                <p className="gg-feedback-translation">{current.translationAr}</p>
              </div>
            </div>
          )}
        </section>
      </GameFrame>
    </div>
  );
};
