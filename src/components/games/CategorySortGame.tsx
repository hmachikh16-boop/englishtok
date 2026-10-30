import React, { useEffect, useMemo, useState } from 'react';
import { Check, FolderTree, RotateCcw, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import type { CategoryKey } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, shuffle, targetLanguageLabel } from './gameUtils';

interface CategorySortGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 10;
const XP_PER_CORRECT = 4;

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  greetings: 'تحيات',
  travel: 'سفر',
  food: 'طعام',
  work: 'عمل',
  shopping: 'تسوق',
  health: 'صحة',
  idioms: 'تعبيرات',
  grammar: 'قواعد',
};

export const CategorySortGame: React.FC<CategorySortGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const language = targetLanguageLabel(userProfile.targetLanguage);
  const finished = queue.length > 0 && position >= queue.length;

  const options = useMemo(() => {
    if (!current) return [];
    const categories = Object.keys(CATEGORY_LABELS) as CategoryKey[];
    const correct = current.category;
    const distractors = shuffle(categories.filter((category) => category !== correct)).slice(0, 3);
    return shuffle([correct, ...distractors]);
  }, [current]);

  useEffect(() => { setSelected(null); setAnswered(false); }, [current?.id, position]);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(buildRound(puzzles, INITIAL_SIZE)); setPosition(0); setSelected(null); setAnswered(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'تصنيف ممتاز!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-category-sort', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    setAnsweredCount((value) => value + 1);
    if (option === current.category) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 5) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 900);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={FolderTree} eyebrow="تصنيف" title="صنّف المفردة" description={`اختر الفئة التي تنتمي إليها الكلمة ${language}.`} onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="teal" footerNote="التصنيف (طعام، سفر، عمل…) يبني روابط دلالية ويسهّل التذكر.">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">أي فئة؟</span>
            <h2 className="gg-word" dir="ltr">{current.word.toLowerCase()}</h2>
            {current.phonetic && <p className="gg-phonetic" dir="ltr">{current.phonetic}</p>}
            <p className="gg-translation">{current.translationAr}</p>
            <button type="button" className="gg-listen-chip" onClick={() => playWord(current.word)}><FolderTree aria-hidden="true" /> استمع</button>
          </div>
          <div className="gg-options" role="group" aria-label="اختر الفئة">
            {options.map((option, index) => {
              const isCorrect = option === current.category;
              const isSelected = option === selected;
              const stateClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
              return (
                <button key={option} type="button" className={`gg-option ${stateClass}`} onClick={() => handleSelect(option)} disabled={answered}>
                  <span className="gg-option-key" aria-hidden="true">{answered && isCorrect ? <Check /> : answered && isSelected ? <X /> : index + 1}</span>
                  <span className="gg-option-value">{CATEGORY_LABELS[option as CategoryKey] ?? option}</span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
