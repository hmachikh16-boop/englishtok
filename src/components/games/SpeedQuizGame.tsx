import React, { useEffect, useMemo, useState } from 'react';
import { Check, Flame, Timer, X, Zap } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFeedback, GameFrame, GameResult } from './GameBits';
import { buildGameOptions, buildRound } from './gameUtils';

interface SpeedQuizGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const ROUND_SIZE = 10;
const XP_PER_CORRECT = 5;
const SECONDS_PER_QUESTION = 10;
const LETTERS = ['A', 'B', 'C', 'D'];

export const SpeedQuizGame: React.FC<SpeedQuizGameProps> = ({
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
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = round[index] ?? null;
  const options = useMemo(
    () => (current ? buildGameOptions(puzzles, current, 'translationAr') : []),
    [current, puzzles],
  );

  useEffect(() => {
    if (!current || answered || finished) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      setSelected(null);
      setStreak(0);
      speechService.playErrorBuzz();
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [answered, current, finished, timeLeft]);

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
            setTimeLeft(SECONDS_PER_QUESTION);
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
      source: 'games-speed',
      text: word.toLowerCase(),
      rate: 0.9,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const correct = selected === current.translationAr;

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === current.translationAr) {
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
    setTimeLeft(SECONDS_PER_QUESTION);
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame
        icon={Zap}
        eyebrow="تحدي السرعة"
        title="اختر بسرعة"
        description="عشر ثوانٍ لكل سؤال. اقرأ الكلمة واختر معناها قبل انتهاء الوقت، وحافظ على سلسلة إجاباتك."
        onBack={onBack}
        current={index + 1}
        total={round.length}
        score={score}
        accent="gold"
        timer={{ value: timeLeft, total: SECONDS_PER_QUESTION }}
        footerNote="إذا انتهى الوقت فستظهر الإجابة الصحيحة مع الجملة. الدقة أولًا، والسرعة تأتي مع التكرار."
      >
        <section className="gg-panel">
          <div className="gg-speed-row">
            <span className="gg-speed-pill">
              <Zap aria-hidden="true" />
              +{XP_PER_CORRECT} XP
            </span>
            <span className="gg-speed-streak">
              <Flame aria-hidden="true" />
              سلسلة {streak}
            </span>
            <span className={`gg-speed-clock ${timeLeft <= 3 ? 'is-low' : ''}`}>
              <Timer aria-hidden="true" />
              {timeLeft}s
            </span>
          </div>

          <div className="gg-question">
            <span className="gg-question-kicker">ما معنى هذه الكلمة؟</span>
            <h2 className="gg-word" dir="ltr">
              {current.word.toLowerCase()}
            </h2>
            {current.phonetic && (
              <p className="gg-phonetic" dir="ltr">
                {current.phonetic}
              </p>
            )}
            <button
              type="button"
              className="gg-listen-chip"
              onClick={() => playWord(current.word)}
            >
              <Zap aria-hidden="true" />
              استمع سريعًا
            </button>
          </div>

          <div className="gg-options" role="group" aria-label="اختر الترجمة الصحيحة">
            {options.map((option, optionIndex) => {
              const isCorrect = option === current.translationAr;
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
              wrongTitle={selected ? 'ليست الإجابة الصحيحة' : 'انتهى الوقت'}
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
