import React, { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, TrendingUp, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildGameOptions, buildRound } from './gameUtils';

interface VocabularyLadderGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 10;
const XP_PER_CORRECT = 5;
const LIVES = 3;

export const VocabularyLadderGame: React.FC<VocabularyLadderGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [round, setRound] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [index, setIndex] = useState(0);
  const [rung, setRung] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = round[index] ?? null;
  const options = useMemo(() => (current ? buildGameOptions(puzzles, current, 'translationAr') : []), [current, puzzles]);
  const finishedByLives = lives <= 0;

  useEffect(() => { setSelected(null); setAnswered(false); }, [current?.id, index]);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;

  const finish = () => setFinished(true);

  if (finished || finishedByLives) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, index)} xp={xp} onReplay={() => { setRound(buildRound(puzzles, INITIAL_SIZE)); setIndex(0); setRung(0); setLives(LIVES); setScore(0); setXp(0); setSelected(null); setAnswered(false); setFinished(false); }} onBack={onBack} title={score >= 7 ? 'وصول للقمة!' : 'واصل التسلق!'} detail={`وصلت إلى الدرجة ${rung} من ${INITIAL_SIZE}، وأجبت ${score} من ${index} بشكل صحيح.`} />
      </div>
    );
  }

  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => speechService.speakText({ source: 'games-ladder', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === current.translationAr) {
      const nextRung = rung + 1;
      setRung(nextRung);
      setScore((value) => value + 1);
      setXp((value) => value + XP_PER_CORRECT);
      onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT });
      speechService.playSuccessChime();
      if (nextRung >= INITIAL_SIZE) { setTimeout(() => setFinished(true), 700); return; }
    } else {
      setLives((value) => value - 1);
      setRung(0);
      speechService.playErrorBuzz();
    }
    setTimeout(() => {
      if (index + 1 >= round.length) setFinished(true);
      else setIndex((value) => value + 1);
    }, 900);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={TrendingUp} eyebrow="تسلق" title="سلم المفردات" description="أجب بشكل صحيح للصعود. خطأ = فقدان حياة وإعادة الدرجة إلى 0." onBack={onBack} current={Math.min(index + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="gold" footerNote={`لديك ${LIVES} قلوب. 10 إجابات صحيحة = صعود كامل.`}>
        <section className="gg-panel">
          <div className="gg-ladder">
            {Array.from({ length: INITIAL_SIZE }).map((_, i) => (
              <span key={i} className={`gg-ladder-rung ${i < rung ? 'is-done' : i === rung ? 'is-current' : ''}`}>{i + 1}</span>
            ))}
          </div>
          <div className="gg-ladder-status">
            <span>❤️ {lives}</span>
            <span>درجة {rung}/{INITIAL_SIZE}</span>
          </div>
          <div className="gg-question">
            <span className="gg-question-kicker">ما معنى هذه الكلمة؟</span>
            <h2 className="gg-word" dir="ltr">{current.word.toLowerCase()}</h2>
            {current.phonetic && <p className="gg-phonetic" dir="ltr">{current.phonetic}</p>}
            <button type="button" className="gg-listen-chip" onClick={() => playWord(current.word)}><TrendingUp aria-hidden="true" /> استمع</button>
          </div>
          <div className="gg-options" role="group" aria-label="اختر الترجمة">
            {options.map((option, optionIndex) => {
              const isCorrect = option === current.translationAr;
              const isSelected = option === selected;
              const stateClass = answered ? (isCorrect ? 'is-correct' : isSelected ? 'is-wrong' : '') : '';
              return (
                <button key={option} type="button" className={`gg-option ${stateClass}`} onClick={() => handleSelect(option)} disabled={answered}>
                  <span className="gg-option-key" aria-hidden="true">{answered && isCorrect ? <Check /> : answered && isSelected ? <X /> : optionIndex + 1}</span>
                  <span className="gg-option-value">{option}</span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
