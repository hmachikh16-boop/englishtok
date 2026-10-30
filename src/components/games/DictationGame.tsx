import React, { useEffect, useMemo, useState } from 'react';
import { Check, Keyboard, RotateCcw, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { buildKeyboardLetters } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, shuffle } from './gameUtils';

interface DictationGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 8;
const XP_PER_CORRECT = 6;

export const DictationGame: React.FC<DictationGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const finished = queue.length > 0 && position >= queue.length;
  const keyboard = useMemo(() => (current ? buildKeyboardLetters(current.word) : []), [current]);

  useEffect(() => { setInput([]); setLocked(false); }, [current?.id, position]);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(buildRound(puzzles, INITIAL_SIZE)); setPosition(0); setInput([]); setLocked(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'إملاء ممتاز!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string, rate = 0.85) => speechService.speakText({ source: 'games-dictation', text: word.toLowerCase(), rate, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleLetter = (letter: string) => {
    if (locked || input.length >= current.word.length) return;
    setInput((value) => [...value, letter]);
    speechService.playPop();
  };

  const handleBackspace = () => {
    if (locked || input.length === 0) return;
    setInput((value) => value.slice(0, -1));
    speechService.playPop();
  };

  useEffect(() => {
    if (!current || locked || input.length !== current.word.length) return;
    setLocked(true);
    const guess = input.join('').toLowerCase();
    const answer = current.word.toLowerCase();
    setAnsweredCount((value) => value + 1);
    if (guess === answer) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 5) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 1000);
  }, [input, current, locked, queue.length]);

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={Keyboard} eyebrow="إملاء" title="استمع واكتب" description="استمع للكلمة واكتبها من الذاكرة. استخدم 'ببطء' إذا needed." onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="blue" footerNote="الإملاء (dictation) يربط الصوت بالتهجئة ويُثبت النطق والكتابة معًا.">
        <section className="gg-panel">
          <div className="gg-listen-stage">
            <button type="button" className="gg-listen-orb" onClick={() => playWord(current.word)} aria-label="استمع إلى الكلمة"><Volume2 aria-hidden="true" /></button>
            <strong>استمع ثم اكتب الكلمة</strong>
            <span>يمكنك إعادة الاستماع بقدر ما تحتاج</span>
            <div className="gg-inline-actions">
              <button type="button" className="gg-soft-btn" onClick={() => playWord(current.word)}><Volume2 aria-hidden="true" /> إعادة</button>
              <button type="button" className="gg-soft-btn" onClick={() => playWord(current.word, 0.62)}><Volume2 aria-hidden="true" /> ببطء</button>
            </div>
          </div>
          <div className="gg-scramble-slots" aria-label="خانات الكتابة">
            {Array.from({ length: current.word.length }).map((_, i) => (
              <span key={i} className={`gg-hangman-letter ${input[i] ? 'is-revealed' : ''}`}>{input[i] ?? ''}</span>
            ))}
          </div>
          <div className="gg-hangman-keyboard" aria-label="لوحة الحروف">
            {keyboard.map((letter, index) => (
              <button key={`${letter}-${index}`} type="button" className="gg-hangman-key" onClick={() => handleLetter(letter)} disabled={locked}>{letter}</button>
            ))}
          </div>
          <div className="gg-feedback-actions">
            <button type="button" className="gg-soft-btn" onClick={handleBackspace} disabled={locked || input.length === 0}>مسح</button>
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
