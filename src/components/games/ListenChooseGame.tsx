import React, { useEffect, useMemo, useState } from 'react';
import { Check, Headphones, Volume1, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFeedback, GameFrame, GameResult } from './GameBits';
import { buildGameOptions, buildRound, targetLanguageLabel } from './gameUtils';

interface ListenChooseGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const ROUND_SIZE = 8;
const XP_PER_CORRECT = 5;
const LETTERS = ['A', 'B', 'C', 'D'];

export const ListenChooseGame: React.FC<ListenChooseGameProps> = ({
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
    () => (current ? buildGameOptions(puzzles, current, 'word') : []),
    [current, puzzles],
  );
  const language = targetLanguageLabel(userProfile.targetLanguage);

  const playWord = (word: string, rate = 0.9) => {
    speechService.speakText({
      source: 'games-listen',
      text: word.toLowerCase(),
      rate,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  useEffect(() => {
    if (!current || answered || finished) return;
    const timer = window.setTimeout(() => playWord(current.word), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, answered, finished]);

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
        icon={Headphones}
        eyebrow="تدريب الاستماع"
        title="استمع واختر"
        description={`استمع إلى الكلمة ${language} ثم اختر شكلها المكتوب. يمكنك الإعادة أو التشغيل البطيء قبل الإجابة.`}
        onBack={onBack}
        current={index + 1}
        total={round.length}
        score={score}
        accent="blue"
        footerNote="الاستماع المتكرر يثبت النطق والتهجئة معًا. استخدم زر التشغيل البطيء إذا كانت الكلمة جديدة عليك."
      >
        <section className="gg-panel">
          <div className="gg-listen-stage">
            <button
              type="button"
              className="gg-listen-orb"
              onClick={() => playWord(current.word)}
              aria-label="استمع إلى الكلمة"
            >
              <Volume2 aria-hidden="true" />
            </button>
            <strong>استمع ثم اختر الكلمة الصحيحة</strong>
            <span>يمكنك إعادة الاستماع بقدر ما تحتاج</span>
            <div className="gg-inline-actions">
              <button
                type="button"
                className="gg-soft-btn"
                onClick={() => playWord(current.word)}
              >
                <Volume2 aria-hidden="true" />
                إعادة
              </button>
              <button
                type="button"
                className="gg-soft-btn"
                onClick={() => playWord(current.word, 0.62)}
              >
                <Volume1 aria-hidden="true" />
                ببطء
              </button>
            </div>
          </div>

          <div className="gg-options" role="group" aria-label="اختر الكلمة التي سمعتها">
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
