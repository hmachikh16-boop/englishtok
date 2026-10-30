import React, { useEffect, useMemo, useState } from 'react';
import { Check, Image as ImageIcon, RotateCcw, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, shuffle, targetLanguageLabel } from './gameUtils';
import type { GamePicture } from '../../data/gamePictureClues';

interface PictureQuizGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 10;
const XP_PER_CORRECT = 4;

export const PictureQuizGame: React.FC<PictureQuizGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).filter((puzzle) => puzzle.picture !== null), [lessons]);
  const [queue, setQueue] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<GamePicture | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const language = targetLanguageLabel(userProfile.targetLanguage);
  const finished = queue.length > 0 && position >= queue.length;

  const pictureKey = (picture: GamePicture) => JSON.stringify(picture);
  const renderPicture = (picture: GamePicture) => {
    switch (picture.kind) {
      case 'emoji':
        return <span className="gg-picture-emoji">{picture.emoji}</span>;
      case 'color':
        return <span className="gg-picture-swatch" style={{ background: picture.color }} aria-label={picture.label} />;
      case 'shape':
        return <span className="gg-picture-emoji">{{ circle: '⭕', square: '⬛', triangle: '🔺', rectangle: '▭', star: '⭐', heart: '❤️' }[picture.shape]}</span>;
      case 'number':
        return <span className="gg-picture-emoji">{picture.value}</span>;
      default:
        return null;
    }
  };
  const pictureLabel = (picture: GamePicture) => {
    switch (picture.kind) {
      case 'emoji':
        return picture.emoji;
      case 'color':
        return picture.label;
      case 'shape':
        return picture.shape;
      case 'number':
        return picture.value;
      default:
        return 'صورة';
    }
  };

  const options = useMemo<GamePicture[]>(() => {
    if (!current?.picture) return [];
    const pool = puzzles.filter((puzzle) => puzzle.id !== current.id && puzzle.picture !== null);
    const distractors = shuffle(pool).slice(0, 3).map((puzzle) => puzzle.picture as GamePicture);
    return shuffle([current.picture, ...distractors]);
  }, [current, puzzles]);

  useEffect(() => {
    setSelected(null);
    setAnswered(false);
  }, [current?.id, position]);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(buildRound(puzzles, INITIAL_SIZE)); setPosition(0); setSelected(null); setAnswered(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'عين ثاقبة!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-picture-quiz', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleSelect = (option: GamePicture) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    setAnsweredCount((value) => value + 1);
    if (pictureKey(option) === pictureKey(current.picture as GamePicture)) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 5) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 900);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={ImageIcon} eyebrow="ربط بصري" title="تخمين الصورة" description={`اقرأ الكلمة ${language} واختر الصورة التي تمثلها.`} onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="rose" footerNote="الربط بين الكلمة والصورة يقوّي الذاكرة البصرية ويُسرّع الاسترجاع.">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">أي صورة تمثل هذه الكلمة؟</span>
            <h2 className="gg-word" dir="ltr">{current.word.toLowerCase()}</h2>
            {current.phonetic && <p className="gg-phonetic" dir="ltr">{current.phonetic}</p>}
            <p className="gg-translation">{current.translationAr}</p>
            <button type="button" className="gg-listen-chip" onClick={() => playWord(current.word)}><ImageIcon aria-hidden="true" /> استمع</button>
          </div>
          <div className="gg-picture-options" role="group" aria-label="اختر الصورة">
            {options.map((option, index) => {
              const isCorrect = pictureKey(option) === pictureKey(current.picture as GamePicture);
              const isSelected = selected ? pictureKey(selected) === pictureKey(option) : false;
              const stateClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
              return (
                <button key={`${pictureKey(option)}-${index}`} type="button" className={`gg-picture-option ${stateClass}`} onClick={() => handleSelect(option)} disabled={answered} aria-label={pictureLabel(option)}>
                  {renderPicture(option)}
                  <span className="gg-picture-label">{pictureLabel(option)}</span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
