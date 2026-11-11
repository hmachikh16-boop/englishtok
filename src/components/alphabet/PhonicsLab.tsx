import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Headphones,
  RotateCw,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  PHONICS_GROUPS,
  type PhonicsGroup,
  type PhonicsWord,
} from '../../data/phonicsLab';
import { speechService } from '../../services/speechService';

interface PhonicsLabProps {
  /** Restrict the wall to a single group, e.g. the one just practised. */
  initialGroupId?: string;
}

interface ListeningQuestion {
  word: PhonicsWord;
  options: PhonicsWord[];
}

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

const uniqueWords = (group: PhonicsGroup): PhonicsWord[] => {
  const seen = new Set<string>();
  const list: PhonicsWord[] = [];
  group.sounds.forEach((sound) => {
    sound.words.forEach((word) => {
      const key = word.word.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push(word);
    });
  });
  return list;
};

const buildQuestions = (group: PhonicsGroup): ListeningQuestion[] => {
  const pool = uniqueWords(group);
  if (pool.length < 4) return [];
  return shuffle(pool)
    .slice(0, 8)
    .map((word) => {
      const distractors = shuffle(pool.filter((entry) => entry.word !== word.word)).slice(0, 3);
      return { word, options: shuffle([word, ...distractors]) };
    });
};

export const PhonicsLab: React.FC<PhonicsLabProps> = ({ initialGroupId }) => {
  const [groupId, setGroupId] = useState(initialGroupId ?? PHONICS_GROUPS[0].id);
  const [quiz, setQuiz] = useState<ListeningQuestion[] | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState<{ score: number; total: number } | null>(null);
  const spokenRef = useRef<string>('');

  const group = useMemo(
    () => PHONICS_GROUPS.find((entry) => entry.id === groupId) ?? PHONICS_GROUPS[0],
    [groupId],
  );

  const speak = useCallback((text: string, rate = 0.85) => {
    speechService.speakText({
      source: 'phonics-lab',
      text,
      rate,
      gender: 'female',
      accent: 'en',
      onStart: () => undefined,
      onEnd: () => undefined,
      onError: () => undefined,
    });
  }, []);

  const speakSound = useCallback(
    (sound: PhonicsWord[]) => {
      speak(sound.map((entry) => entry.word).join(', '), 0.82);
    },
    [speak],
  );

  const startQuiz = useCallback(() => {
    setQuiz(buildQuestions(group));
    setQuizIndex(0);
    setChoice(null);
    setScore(0);
    spokenRef.current = '';
  }, [group]);

  const currentQuestion = quiz?.[quizIndex] ?? null;

  // Announce the target word of each listening question. Clicking "start" is a
  // user gesture, so the first clip is always allowed; later clips follow taps.
  useEffect(() => {
    if (!currentQuestion) return;
    const key = `${quizIndex}:${currentQuestion.word.word}`;
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    const timer = window.setTimeout(() => speak(currentQuestion.word.word, 0.8), 120);
    return () => window.clearTimeout(timer);
  }, [currentQuestion, quizIndex, speak]);

  const chooseAnswer = useCallback(
    (word: string) => {
      if (!currentQuestion || choice) return;
      setChoice(word);
      if (word === currentQuestion.word.word) {
        setScore((value) => value + 1);
        speechService.playSuccessChime();
      } else {
        speechService.playErrorBuzz();
        speak(currentQuestion.word.word, 0.8);
      }
    },
    [choice, currentQuestion, speak],
  );

  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    if (quizIndex + 1 >= quiz.length) {
      setFinished({ score, total: quiz.length });
      setQuiz(null);
      speechService.playSuccessChime();
      return;
    }
    setQuizIndex((index) => index + 1);
    setChoice(null);
  }, [quiz, quizIndex, score]);

  /* ---------------- Listening quiz ---------------- */
  if (quiz && currentQuestion) {
    const isCorrect = choice === currentQuestion.word.word;
    return (
      <div className="phonics-quiz" dir="rtl">
        <div className="phonics-quiz-top">
          <span className="phonics-quiz-kicker">
            <Headphones className="h-4 w-4" aria-hidden="true" /> استمع واختر
          </span>
          <span className="phonics-quiz-progress">
            {quizIndex + 1} / {quiz.length} · {score} صحيحة
          </span>
        </div>

        <div className="phonics-quiz-stage">
          <button
            type="button"
            className="phonics-listen-big"
            onClick={() => speak(currentQuestion.word.word, 0.78)}
          >
            <Volume2 className="h-7 w-7" aria-hidden="true" />
            <span>استمع مرة أخرى</span>
          </button>
          <p className="phonics-quiz-prompt">أي كلمة سمعتها؟</p>
        </div>

        <div className="phonics-quiz-options">
          {currentQuestion.options.map((option) => {
            const correct = option.word === currentQuestion.word.word;
            const selected = choice === option.word;
            const state = choice ? (correct ? 'is-correct' : selected ? 'is-wrong' : '') : '';
            return (
              <button
                key={option.word}
                type="button"
                className={`phonics-quiz-option ${state}`}
                onClick={() => chooseAnswer(option.word)}
                disabled={choice !== null}
              >
                <span dir="ltr" className="phonics-quiz-option-word">{option.word}</span>
                {choice ? <span className="phonics-quiz-option-ar">{option.ar}</span> : null}
              </button>
            );
          })}
        </div>

        {choice ? (
          <div className="phonics-quiz-feedback">
            <span className={isCorrect ? 'is-correct' : 'is-wrong'}>
              {isCorrect ? (
                <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> أحسنت! نطق واضح.</>
              ) : (
                <><XCircle className="h-4 w-4" aria-hidden="true" /> الصحيح: {currentQuestion.word.word} — {currentQuestion.word.ar}</>
              )}
            </span>
            <button type="button" className="alphabet-quiz-next" onClick={nextQuestion}>
              {quizIndex + 1 >= quiz.length ? 'إنهاء' : 'التالي'}
              <ChevronLeft aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" className="phonics-quiz-exit" onClick={() => setQuiz(null)}>
            إلغاء الاختبار
          </button>
        )}
      </div>
    );
  }

  /* ---------------- Sound wall ---------------- */
  return (
    <div className="phonics-lab" dir="rtl">
      <div className="phonics-group-rail" role="tablist" aria-label="مجموعات الأصوات">
        {PHONICS_GROUPS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={entry.id === group.id}
            className={`phonics-group-chip ${entry.id === group.id ? 'is-active' : ''}`}
            onClick={() => {
              speechService.playPop();
              setGroupId(entry.id);
            }}
          >
            {entry.titleAr}
          </button>
        ))}
      </div>

      <div className="phonics-group-head">
        <div className="min-w-0">
          <h4 className="phonics-group-title">{group.titleAr}</h4>
          <p className="phonics-group-en" dir="ltr">{group.titleEn}</p>
        </div>
        <button type="button" className="phonics-quiz-start" onClick={startQuiz}>
          <Headphones className="h-4 w-4" aria-hidden="true" /> اختبار الاستماع
        </button>
      </div>

      <p className="phonics-group-note">{group.noteAr}</p>

      {finished && (
        <div className="phonics-result">
          <span>
            نتيجة اختبار الاستماع: <strong>{finished.score} / {finished.total}</strong>
          </span>
          <button type="button" onClick={() => setFinished(null)}>إخفاء</button>
        </div>
      )}

      <div className="phonics-sound-grid">
        {group.sounds.map((sound) => (
          <article key={sound.id} className="phonics-sound-card">
            <header className="phonics-sound-head">
              <span className="phonics-sound-symbol" dir="ltr">{sound.symbol}</span>
              <span className="phonics-sound-hint">{sound.hintAr}</span>
            </header>
            <div className="phonics-word-list">
              {sound.words.map((word) => (
                <button
                  key={`${sound.id}-${word.word}`}
                  type="button"
                  className="phonics-word-chip"
                  onClick={() => speak(word.word, 0.85)}
                  aria-label={`استمع إلى ${word.word}`}
                >
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span dir="ltr" className="phonics-word-en">{word.word}</span>
                  <span className="phonics-word-ar">{word.ar}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="phonics-sound-listen"
              onClick={() => speakSound(sound.words)}
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> استمع للكل
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};
