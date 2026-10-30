import React, { useEffect, useMemo, useState } from 'react';
import { Check, HelpCircle, RotateCcw, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { shuffle, targetLanguageLabel } from './gameUtils';
import type { GamePuzzle } from '../../services/gamePuzzles';

interface OddOneOutGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

interface OddRound {
  items: GamePuzzle[];
  oddId: string;
}

const INITIAL_SIZE = 8;
const XP_PER_CORRECT = 5;

const buildOddRounds = (puzzles: GamePuzzle[], size: number): OddRound[] => {
  const categories = [...new Set(puzzles.map((puzzle) => puzzle.category))];
  const rounds: OddRound[] = [];
  for (let index = 0; index < size; index += 1) {
    if (categories.length < 2) break;
    const oddCategory = categories[Math.floor(Math.random() * categories.length)];
    const mainCandidates = categories.filter((category) => category !== oddCategory);
    const mainCategory = mainCandidates[Math.floor(Math.random() * mainCandidates.length)];
    const mainItems = shuffle(puzzles.filter((puzzle) => puzzle.category === mainCategory)).slice(0, 3);
    const oddItem = shuffle(puzzles.filter((puzzle) => puzzle.category === oddCategory))[0];
    if (mainItems.length < 3 || !oddItem) continue;
    rounds.push({ items: shuffle([...mainItems, oddItem]), oddId: oddItem.id });
  }
  return rounds;
};

export const OddOneOutGame: React.FC<OddOneOutGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState<OddRound[]>(() => buildOddRounds(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const language = targetLanguageLabel(userProfile.targetLanguage);
  const finished = queue.length > 0 && position >= queue.length;

  useEffect(() => { setSelected(null); setAnswered(false); }, [position]);

  if (puzzles.length < 8) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(buildOddRounds(puzzles, INITIAL_SIZE)); setPosition(0); setSelected(null); setAnswered(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'عين ثاقبة!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-odd-one-out', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleSelect = (item: GamePuzzle) => {
    if (answered) return;
    setSelected(item.id);
    setAnswered(true);
    setAnsweredCount((value) => value + 1);
    if (item.id === current.oddId) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 4) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 900);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={HelpCircle} eyebrow="تفكير" title="الشاذ" description={`أي كلمة لا تنتمي إلى نفس الفئة؟ (${language})`} onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="violet" footerNote="الشاذ يدرّب التصنيف والانتباه للتفاصيل (فئة، نوع، سياق).">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">اختر الكلمة الشاذة</span>
            <p className="gg-translation">ثلاث كلمات من فئة واحدة، وواحدة من فئة مختلفة.</p>
          </div>
          <div className="gg-options" role="group" aria-label="اختر الشاذ">
            {current.items.map((item, index) => {
              const isCorrect = item.id === current.oddId;
              const isSelected = item.id === selected;
              const stateClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
              return (
                <button key={item.id} type="button" className={`gg-option ${stateClass}`} onClick={() => handleSelect(item)} disabled={answered}>
                  <span className="gg-option-key" aria-hidden="true">{answered && isCorrect ? <Check /> : answered && isSelected ? <X /> : index + 1}</span>
                  <span className="gg-option-value">
                    <span dir="ltr">{item.word.toLowerCase()}</span>
                    <span className="gg-option-translation">{item.translationAr}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
