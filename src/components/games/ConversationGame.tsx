import React, { useMemo, useState } from 'react';
import { Check, MessageSquareText, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { speechService } from '../../services/speechService';
import { GameFeedback, GameFrame, GameResult, GameEmpty } from './GameBits';
import { shuffle, targetLanguageLabel } from './gameUtils';

interface ConversationGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

interface ConvoPuzzle {
  id: string;
  prompt: string;
  promptAr: string;
  response: string;
  responseAr: string;
  lessonTitleAr: string;
  stage: number;
}

const ROUND_SIZE = 8;
const XP_PER_CORRECT = 10;
const LETTERS = ['A', 'B', 'C', 'D'];

const buildConvoPuzzles = (lessons: Lesson[]): ConvoPuzzle[] => {
  const seen = new Set<string>();
  const puzzles: ConvoPuzzle[] = [];
  lessons.forEach((lesson) => {
    const stage = lesson.curriculumStage ?? 1;
    const lines = lesson.dialogue ?? [];
    for (let i = 0; i < lines.length - 1; i += 1) {
      const prompt = (lines[i].textEn || '').trim();
      const response = (lines[i + 1].textEn || '').trim();
      if (!prompt || !response || prompt === response) continue;
      const key = prompt.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      puzzles.push({
        id: `${lesson.id}::${lines[i].id}`,
        prompt,
        promptAr: (lines[i].textAr || '').trim(),
        response,
        responseAr: (lines[i + 1].textAr || '').trim(),
        lessonTitleAr: lesson.titleAr,
        stage,
      });
    }
  });
  return puzzles;
};

export const ConversationGame: React.FC<ConversationGameProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const puzzles = useMemo(() => buildConvoPuzzles(lessons), [lessons]);
  const [roundKey, setRoundKey] = useState(0);
  const round = useMemo(() => {
    const shuffled = shuffle(puzzles);
    return shuffled.slice(0, Math.min(ROUND_SIZE, shuffled.length));
  }, [puzzles, roundKey]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = round[index] ?? null;

  const options = useMemo(() => {
    if (!current) return [];
    const distractors = shuffle(
      puzzles.filter((p) => p.id !== current.id).map((p) => p.response),
    ).slice(0, 3);
    return shuffle([current.response, ...distractors]);
  }, [current, puzzles]);

  const language = targetLanguageLabel(userProfile.targetLanguage);

  if (puzzles.length === 0 && !finished) return <GameEmpty onBack={onBack} />;

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

  const playLine = (text: string) => {
    speechService.speakText({
      source: 'games-conversation',
      text: text.toLowerCase(),
      rate: 0.9,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const correct = selected === current.response;

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === current.response) {
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
        icon={MessageSquareText}
        eyebrow="محادثة"
        title="أكمل المحادثة"
        description={`اقرأ réplique ${language} واختر الرد (response) الأنسب. كل سؤال = جملة من درس.`}
        onBack={onBack}
        current={index + 1}
        total={round.length}
        score={score}
        accent="gold"
        footerNote={`كل إجابة صحيحة = ${XP_PER_CORRECT} XP. استمع للنطق قبل اختيار الرد.`}
      >
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">ما الرد (response) الأنسب؟</span>
            <p
              className="gg-sentence"
              dir="ltr"
              style={{ marginTop: 10, fontSize: 'clamp(14px, 3.6vw, 18px)' }}
            >
              {current.prompt}
            </p>
            {current.promptAr && (
              <p className="gg-sentence-ar">{current.promptAr}</p>
            )}
            <button
              type="button"
              className="gg-listen-chip"
              onClick={() => playLine(current.prompt)}
            >
              <Volume2 aria-hidden="true" />
              استمع للجملة
            </button>
          </div>

          <div className="gg-options" role="group" aria-label="اختر الرد (response) الأنسب">
            {options.map((option, optionIndex) => {
              const isCorrect = option === current.response;
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
                  <span className="gg-option-value is-ltr">{option}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <GameFeedback
              correct={correct}
              answer={current.response}
              translation={current.responseAr}
              example={current.response}
              exampleAr={current.responseAr}
              onListen={() => playLine(current.response)}
              onNext={handleNext}
              nextLabel={index + 1 >= round.length ? 'عرض النتيجة' : 'السؤال التالي'}
            />
          )}
        </section>
      </GameFrame>
    </div>
  );
};
