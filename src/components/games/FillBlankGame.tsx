import React, { useMemo, useState } from 'react';
import { Check, PenLine, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFeedback, GameFrame, GameResult } from './GameBits';
import {
  buildGameOptions,
  buildRound,
  escapeRegExp,
  targetLanguageLabel,
} from './gameUtils';

interface FillBlankGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const ROUND_SIZE = 8;
const XP_PER_CORRECT = 5;
const LETTERS = ['A', 'B', 'C', 'D'];

export const FillBlankGame: React.FC<FillBlankGameProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const puzzles = useMemo(
    () => buildGamePuzzles(lessons).filter((puzzle) => puzzle.exampleSentence.trim().length > 0),
    [lessons],
  );
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
    () => (current ? buildGameOptions(puzzles, current, 'word', 4, true) : []),
    [current, puzzles],
  );
  const sentenceParts = useMemo(() => {
    if (!current) return [];
    const matcher = new RegExp(`(${escapeRegExp(current.word)})`, 'gi');
    return current.exampleSentence.split(matcher).map((part, partIndex) => ({
      key: `${current.id}-part-${partIndex}`,
      part,
      isWord: part.toLowerCase() === current.word.toLowerCase(),
    }));
  }, [current]);
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

  const playWord = (word: string) => {
    speechService.speakText({
      source: 'games-fill-blank',
      text: word.toLowerCase(),
      rate: 0.9,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const correct = selected === current.word.toLowerCase();

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === current.word.toLowerCase()) {
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
        icon={PenLine}
        eyebrow="السياق والاستخدام"
        title="أكمل الجملة"
        description={`اختر الكلمة ${language} التي تكمل الجملة. المعنى العربي للجملة ظاهر دائمًا لمساعدتك على الفهم.`}
        onBack={onBack}
        current={index + 1}
        total={round.length}
        score={score}
        accent="rose"
        footerNote="تعلّم الكلمة داخل جملة يجعل استرجاعها أسهل. استمع للجملة كاملة بعد الإجابة لتثبيت النطق."
      >
        <section className="gg-panel">
          <div className="gg-fill-head">
            <span className="gg-question-kicker">اختر الكلمة المناسبة للفراغ</span>
            <span className="gg-part-chip">{current.partOfSpeech}</span>
          </div>

          <p className="gg-sentence" dir="ltr">
            {sentenceParts.map(({ key, part, isWord }) =>
              isWord ? (
                <span key={key} className="gg-blank" aria-label="فراغ">
                  _____
                </span>
              ) : (
                <span key={key}>{part}</span>
              ),
            )}
          </p>
          <p className="gg-sentence-ar">{current.exampleSentenceAr}</p>

          <div className="gg-options" role="group" aria-label="اختر الكلمة المناسبة">
            {options.map((option, optionIndex) => {
              const isCorrect = option === current.word.toLowerCase();
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
                  <span className="gg-option-value is-ltr" dir="ltr">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {answered && (
            <GameFeedback
              correct={correct}
              answer={current.word}
              translation={current.translationAr}
              example={current.exampleSentence}
              exampleAr={current.exampleSentenceAr}
              onListen={() => playWord(current.word)}
              onNext={handleNext}
              nextLabel={index + 1 >= round.length ? 'عرض النتيجة' : 'السؤال التالي'}
            />
          )}
        </section>
      </GameFrame>
    </div>
  );
};
