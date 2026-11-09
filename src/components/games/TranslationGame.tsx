import React, { useMemo, useState } from 'react';
import { BookOpen, Check, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameFeedback, GameFrame, GameResult, GameEmpty } from './GameBits';
import {
  buildGameOptions,
  buildRound,
  targetLanguageLabel,
} from './gameUtils';

interface TranslationGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const ROUND_SIZE = 8;
const XP_PER_CORRECT = 8;
const LETTERS = ['A', 'B', 'C', 'D'];

export const TranslationGame: React.FC<TranslationGameProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [roundKey, setRoundKey] = useState(0);
  const round = useMemo(() => buildRound(puzzles, ROUND_SIZE), [puzzles, roundKey]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = round[index] ?? null;
  const options = useMemo(
    () => (current ? buildGameOptions(puzzles, current, 'exampleSentenceAr') : []),
    [current, puzzles],
  );
  const language = targetLanguageLabel(userProfile.targetLanguage);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;

  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult
          score={score}
          total={round.length}
          xp={xp}
          bestStreak={bestStreak}
          onReplay={() => {
            setRoundKey((value) => value + 1);
            setIndex(0);
            setScore(0);
            setXp(0);
            setStreak(0);
            setBestStreak(0);
            setSelected(null);
            setAnswered(false);
            setFinished(false);
          }}
          onBack={onBack}
        />
      </div>
    );
  }

  if (!current) return <GameEmpty onBack={onBack} />;

  const playSentence = (text: string) => {
    speechService.speakText({
      source: 'games-translation',
      text: text.toLowerCase(),
      rate: 0.85,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const correct = selected === current.exampleSentenceAr;

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === current.exampleSentenceAr) {
      const nextStreak = streak + 1;
      setScore((value) => value + 1);
      setXp((value) => value + XP_PER_CORRECT);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT });
      speechService.playSuccessChime();
      return;
    }
    setStreak(0);
    speechService.playErrorBuzz();
  };

  const handleNext = () => {
    if (index + 1 >= round.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame
        icon={BookOpen}
        eyebrow="ترجمة جمل"
        title="ترجم الجملة"
        description={`اقرأ الجملة ${language} واختر ترجمتها العربية. الترجمة الدقيقة تساعدك على تثبيت المفردات في السياق.`}
        onBack={onBack}
        current={index + 1}
        total={round.length}
        score={score}
        accent="gold"
        footerNote={`كل إجابة صحيحة = ${XP_PER_CORRECT} XP. ركّز على المفردات والترتيب (SVO).`}
      >
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">ترجم هذه الجملة:</span>
            <h2 className="gg-word" dir="ltr" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
              {current.exampleSentence}
            </h2>
            <button
              type="button"
              className="gg-listen-chip"
              onClick={() => playSentence(current.exampleSentence)}
            >
              <Volume2 aria-hidden="true" />
              استمع للنطق
            </button>
          </div>

          <div className="gg-options" role="group" aria-label="اختر الترجمة الصحيحة">
            {options.map((option, optionIndex) => {
              const isCorrect = option === current.exampleSentenceAr;
              const isSelected = option === selected;
              const stateClass = answered
                ? isCorrect
                  ? 'is-correct'
                  : isSelected
                    ? 'is-wrong'
                    : ''
                : '';
              return (
                <button
                  key={option}
                  type="button"
                  className={`gg-option ${stateClass}`}
                  onClick={() => handleSelect(option)}
                  disabled={answered}
                >
                  <span className="gg-option-key" aria-hidden="true">
                    {answered && isCorrect ? (
                      <Check />
                    ) : answered && isSelected ? (
                      <X />
                    ) : (
                      LETTERS[optionIndex] ?? optionIndex + 1
                    )}
                  </span>
                  <span className="gg-option-value">{option}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <GameFeedback
              correct={correct}
              answer={current.exampleSentence}
              translation={current.exampleSentenceAr}
              example={current.exampleSentence}
              exampleAr={current.exampleSentenceAr}
              onListen={() => playSentence(current.exampleSentence)}
              onNext={handleNext}
              nextLabel={index + 1 >= round.length ? 'عرض النتيجة' : 'السؤال التالي'}
            />
          )}
        </section>
      </GameFrame>
    </div>
  );
};
