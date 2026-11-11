import React, { useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Headphones, Type, Volume2, Sparkles, CheckCircle2, X } from 'lucide-react';
import { ALPHABET, type AlphabetLetter } from '../../data/alphabet';
import { speechService } from '../../services/speechService';
import { PhonicsLab } from './PhonicsLab';

interface AlphabetWindowProps {
  onClose: () => void;
}

type Mode = 'learn' | 'quiz';

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const AlphabetWindow: React.FC<AlphabetWindowProps> = ({ onClose }) => {
  const [mode, setMode] = useState<Mode>('learn');
  const [view, setView] = useState<'letters' | 'sounds'>('letters');
  const [index, setIndex] = useState(0);
  const [quizQueue, setQuizQueue] = useState<AlphabetLetter[]>([]);
  const [quizPos, setQuizPos] = useState(0);
  const [quizOptions, setQuizOptions] = useState<AlphabetLetter[]>([]);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  const letter = ALPHABET[index];

  const speak = useCallback((text: string, rate = 0.9) => {
    speechService.speakText({
      source: 'alphabet',
      text,
      rate,
      gender: 'female',
      accent: 'en',
      onStart: () => undefined,
      onEnd: () => undefined,
      onError: () => undefined,
    });
  }, []);

  const speakLetter = useCallback(() => {
    speak(`${letter.letter}. ${letter.name}. ${letter.word}. ${letter.sentence}`, 0.88);
  }, [letter, speak]);

  const startQuiz = useCallback(() => {
    const queue = shuffle(ALPHABET).slice(0, 8);
    setQuizQueue(queue);
    setQuizPos(0);
    setQuizScore(0);
    setQuizTotal(0);
    setQuizChoice(null);
    // Build options for first question.
    const correct = queue[0];
    const distractors = shuffle(ALPHABET.filter((l) => l.letter !== correct.letter)).slice(0, 3);
    setQuizOptions(shuffle([correct, ...distractors]));
    setMode('quiz');
  }, []);

  const handleQuizChoice = useCallback(
    (choice: string) => {
      if (quizChoice) return;
      setQuizChoice(choice);
      const correct = quizQueue[quizPos].letter;
      const isCorrect = choice === correct;
      if (isCorrect) {
        setQuizScore((s) => s + 1);
        speak('Correct!', 1.0);
      } else {
        speak(`The answer is ${correct}.`, 0.9);
      }
      setQuizTotal((t) => t + 1);
    },
    [quizChoice, quizQueue, quizPos, speak],
  );

  const nextQuiz = useCallback(() => {
    const next = quizPos + 1;
    if (next >= quizQueue.length) {
      setMode('learn');
      setIndex(0);
      return;
    }
    setQuizPos(next);
    setQuizChoice(null);
    const correct = quizQueue[next];
    const distractors = shuffle(ALPHABET.filter((l) => l.letter !== correct.letter)).slice(0, 3);
    setQuizOptions(shuffle([correct, ...distractors]));
  }, [quizPos, quizQueue]);

  const prev = () => setIndex((i) => (i - 1 + ALPHABET.length) % ALPHABET.length);
  const next = () => setIndex((i) => (i + 1) % ALPHABET.length);

  if (view === 'sounds') {
    return (
      <section className="home-window alphabet-window phonics-window" aria-label="مختبر الصوتيات">
        <header className="home-window-head">
          <button
            type="button"
            className="home-window-back"
            onClick={() => setView('letters')}
            aria-label="رجوع إلى الحروف"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h3 className="home-window-title">مختبر الصوتيات</h3>
            <p className="home-window-sub">
              <Headphones className="inline h-3 w-3 align-[-2px]" aria-hidden="true" /> المرحلة الأولى · أصوات وحركات مع النطق
            </p>
          </div>
          <button type="button" className="home-window-back" onClick={onClose} aria-label="إغلاق الصوتيات">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <PhonicsLab />
      </section>
    );
  }

  if (mode === 'quiz' && quizQueue.length > 0) {
    const q = quizQueue[quizPos];
    return (
      <section className="home-window alphabet-window" aria-label="اختبار الحروف">
        <header className="home-window-head">
          <button type="button" className="home-window-back" onClick={() => setMode('learn')} aria-label="إغلاق الاختبار">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h3 className="home-window-title">اختبار الحروف</h3>
            <p className="home-window-sub">سؤال {quizPos + 1} من {quizQueue.length} · النتيجة {quizScore}/{quizTotal}</p>
          </div>
        </header>
        <div className="alphabet-quiz">
          <div className="alphabet-quiz-prompt">
            <span className="alphabet-quiz-letter">{q.letter}</span>
            <p>أي كلمة تبدأ بهذا الحرف؟</p>
          </div>
          <div className="alphabet-quiz-options">
            {quizOptions.map((opt) => {
              const isCorrect = opt.letter === q.letter;
              const isSelected = quizChoice === opt.letter;
              const showResult = quizChoice !== null;
              const cls = showResult
                ? isCorrect
                  ? 'is-correct'
                  : isSelected
                    ? 'is-wrong'
                    : ''
                : '';
              return (
                <button
                  key={opt.letter}
                  type="button"
                  className={`alphabet-quiz-option ${cls}`}
                  onClick={() => handleQuizChoice(opt.letter)}
                  disabled={quizChoice !== null}
                >
                  <span className="alphabet-quiz-option-letter">{opt.letter}</span>
                  <span className="alphabet-quiz-option-word">{opt.word}</span>
                  <span className="alphabet-quiz-option-ar">{opt.wordAr}</span>
                </button>
              );
            })}
          </div>
          {quizChoice && (
            <div className="alphabet-quiz-feedback">
              {quizChoice === q.letter ? (
                <span className="is-correct"><CheckCircle2 className="h-4 w-4" /> أحسنت!</span>
              ) : (
                <span className="is-wrong">الإجابة الصحيحة: <strong>{q.letter}</strong> — {q.word}</span>
              )}
              <button type="button" className="alphabet-quiz-next" onClick={nextQuiz}>
                {quizPos + 1 >= quizQueue.length ? 'إنهاء' : 'التالي'}
                <ChevronLeft aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="home-window alphabet-window" aria-label="الحروف الأبجدية">
      <header className="home-window-head">
        <button type="button" className="home-window-back" onClick={onClose} aria-label="إغلاق الحروف">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h3 className="home-window-title">الحروف الأبجدية</h3>
          <p className="home-window-sub">26 حرفًا · صوت ومثال وجملة</p>
        </div>
        <button type="button" className="alphabet-quiz-start" onClick={startQuiz}>
          <Sparkles className="h-4 w-4" aria-hidden="true" /> اختبر نفسك
        </button>
      </header>

      <div className="alphabet-tabs" role="tablist" aria-label="أقسام الصوتيات">
        <button
          type="button"
          role="tab"
          aria-selected
          className="alphabet-tab is-active"
          onClick={() => setView('letters')}
        >
          الحروف A–Z
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          className="alphabet-tab"
          onClick={() => {
            speechService.playPop();
            setView('sounds');
          }}
        >
          <Headphones className="h-3.5 w-3.5" aria-hidden="true" /> الأصوات والحركات
        </button>
      </div>

      <div className="alphabet-learn">
        <div className="alphabet-letter-card">
          <div className="alphabet-letter-glyph" style={{ color: letter.tone }}>
            <span className="alphabet-letter-upper">{letter.letter}</span>
            <span className="alphabet-letter-lower">{letter.lower}</span>
          </div>
          <div className="alphabet-letter-body">
            <div className="alphabet-letter-name">
              <span>اسم الحرف</span>
              <strong dir="ltr">{letter.name}</strong>
            </div>
            <div className="alphabet-letter-sound">
              <span>الصوت</span>
              <strong>{letter.soundAr}</strong>
            </div>
            <div className="alphabet-letter-example">
              {letter.thumb && (
                <img src={`/animals/${letter.thumb}`} alt="" className="alphabet-letter-thumb" />
              )}
              <div className="min-w-0">
                <div className="alphabet-letter-word">
                  <strong dir="ltr">{letter.word}</strong>
                  <span>{letter.wordAr}</span>
                </div>
                <p className="alphabet-letter-sentence" dir="ltr">{letter.sentence}</p>
                <p className="alphabet-letter-sentence-ar">{letter.sentenceAr}</p>
              </div>
            </div>
            <button type="button" className="alphabet-listen-btn" onClick={speakLetter}>
              <Volume2 className="h-4 w-4" aria-hidden="true" /> استمع للحرف والكلمة والجملة
            </button>
          </div>
        </div>

        <div className="alphabet-nav">
          <button type="button" className="alphabet-nav-btn" onClick={prev} aria-label="الحرف السابق">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="alphabet-nav-counter">{index + 1} / {ALPHABET.length}</span>
          <button type="button" className="alphabet-nav-btn" onClick={next} aria-label="الحرف التالي">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="alphabet-grid">
          {ALPHABET.map((l, i) => (
            <button
              key={l.letter}
              type="button"
              className={`alphabet-grid-tile ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`حرف ${l.letter}`}
              style={{ borderColor: i === index ? l.tone : undefined }}
            >
              <span className="alphabet-grid-letter" style={{ color: l.tone }}>{l.letter}</span>
              {l.thumb && <img src={`/animals/${l.thumb}`} alt="" className="alphabet-grid-thumb" />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
