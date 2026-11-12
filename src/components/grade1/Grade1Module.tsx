import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import {
  GRADE1_LESSONS,
  GRADE1_UNITS,
  grade1ActivityLabel,
  type Grade1Activity,
  type Grade1Lesson,
  type Grade1Word,
} from '../../data/grade1Curriculum';
import { speechService } from '../../services/speechService';
import './grade1.css';

/**
 * Grade 1 module — a pastel, child-friendly English workbook.
 *
 * The module is intentionally self-contained: it does not depend on the main
 * curriculum or on any server asset. Words are illustrated with emoji, which
 * keeps the lesson readable offline and identical on phones and tablets.
 */
export const Grade1Module: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => GRADE1_LESSONS.find((lesson) => lesson.id === selectedId) ?? null,
    [selectedId],
  );

  const openLesson = (lesson: Grade1Lesson) => {
    setSelectedId(lesson.id);
    speechService.playPop();
  };

  if (selected) {
    return (
      <Grade1LessonView
        lesson={selected}
        onBack={() => setSelectedId(null)}
        onNavigate={(id) => setSelectedId(id)}
      />
    );
  }

  return (
    <div className="g1-shell" dir="rtl">
      <header className="g1-hero">
        <div className="g1-hero-sky" aria-hidden="true">
          <span className="g1-sun"><Sun /></span>
          <span className="g1-cloud g1-cloud-a" />
          <span className="g1-cloud g1-cloud-b" />
          <span className="g1-rainbow" />
        </div>
        <div className="g1-hero-copy">
          <span className="g1-kicker"><Star aria-hidden="true" /> الصف الأول الابتدائي</span>
          <h1>هيا نتعلّم الإنجليزية!</h1>
          <p>50 درسًا تفاعليًا: اربط، لوّن، اكتب، عُدّ، وأكمل الحروف.</p>
        </div>
        <div className="g1-hero-stats">
          <span><strong>{GRADE1_LESSONS.length}</strong> درسًا</span>
          <span><strong>5</strong> وحدات</span>
          <span><strong>5</strong> أنشطة</span>
        </div>
      </header>

      {GRADE1_UNITS.map((unit) => {
        const lessons = GRADE1_LESSONS.filter((lesson) => lesson.unit === unit.unit);
        return (
          <section key={unit.unit} className="g1-unit" aria-labelledby={`g1-unit-${unit.unit}`}>
            <div className="g1-unit-head">
              <span className="g1-unit-badge">{unit.unit}</span>
              <div>
                <h2 id={`g1-unit-${unit.unit}`}>{unit.unitAr}</h2>
                <p>{lessons.length} دروس · أنشطة متنوعة</p>
              </div>
            </div>
            <div className="g1-lesson-grid">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`g1-lesson-card ${index % 2 === 0 ? 'is-a' : 'is-b'}`}
                  onClick={() => openLesson(lesson)}
                >
                  <span className="g1-lesson-emoji" aria-hidden="true">{lesson.words[0]?.emoji}</span>
                  <span className="g1-lesson-card-copy">
                    <strong>{lesson.topicAr}</strong>
                    <small>{grade1ActivityLabel(lesson.activity)}</small>
                  </span>
                  <span className="g1-lesson-arrow" aria-hidden="true"><ArrowRight /></span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Lesson screen                                                      */
/* ------------------------------------------------------------------ */

interface LessonViewProps {
  lesson: Grade1Lesson;
  onBack: () => void;
  onNavigate: (id: string) => void;
}

const Grade1LessonView: React.FC<LessonViewProps> = ({ lesson, onBack, onNavigate }) => {
  const index = GRADE1_LESSONS.findIndex((item) => item.id === lesson.id);
  const previous = index > 0 ? GRADE1_LESSONS[index - 1] : null;
  const next = index < GRADE1_LESSONS.length - 1 ? GRADE1_LESSONS[index + 1] : null;
  const [activityKey, setActivityKey] = useState(0);

  const speak = useCallback((word: string) => {
    speechService.speakText({
      source: `grade1-${lesson.id}`,
      text: word,
      rate: 0.85,
      gender: 'female',
      accent: 'en',
    });
  }, [lesson.id]);

  return (
    <div className="g1-shell g1-lesson-view" dir="rtl">
      <button type="button" className="g1-back" onClick={onBack}>
        <ArrowRight aria-hidden="true" />
        كل الدروس
      </button>

      <header className="g1-lesson-head">
        <span className="g1-kicker">الوحدة {lesson.unit} · {lesson.unitAr}</span>
        <h1>{lesson.topicAr}</h1>
        <p dir="ltr">{lesson.topic}</p>
        <div className="g1-word-strip">
          {lesson.words.map((word) => (
            <button
              key={word.en}
              type="button"
              className="g1-word-chip"
              onClick={() => speak(word.en)}
              aria-label={`اسمع ${word.en}`}
            >
              <span aria-hidden="true">{word.emoji}</span>
              <strong dir="ltr">{word.en}</strong>
              <small>{word.ar}</small>
              <Volume2 aria-hidden="true" />
            </button>
          ))}
        </div>
      </header>

      <section className="g1-activity" aria-live="polite">
        <div className="g1-activity-head">
          <span className="g1-activity-badge">{grade1ActivityLabel(lesson.activity)}</span>
          <button
            type="button"
            className="g1-retry"
            onClick={() => setActivityKey((value) => value + 1)}
          >
            <RotateCcw aria-hidden="true" /> إعادة
          </button>
        </div>
        <Activity key={`${lesson.id}-${activityKey}`} lesson={lesson} onSpeak={speak} />
      </section>

      <nav className="g1-lesson-nav" aria-label="التنقل بين الدروس">
        <button
          type="button"
          className="g1-nav-btn"
          disabled={!previous}
          onClick={() => previous && onNavigate(previous.id)}
        >
          <ArrowRight aria-hidden="true" /> السابق
        </button>
        <button type="button" className="g1-nav-btn g1-nav-next" onClick={onBack}>
          قائمة الدروس
        </button>
        <button
          type="button"
          className="g1-nav-btn"
          disabled={!next}
          onClick={() => next && onNavigate(next.id)}
        >
          التالي <ArrowRight aria-hidden="true" className="g1-flip" />
        </button>
      </nav>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Activities                                                         */
/* ------------------------------------------------------------------ */

interface ActivityProps {
  lesson: Grade1Lesson;
  onSpeak: (word: string) => void;
}

const Activity: React.FC<ActivityProps> = ({ lesson, onSpeak }) => {
  switch (lesson.activity) {
    case 'match':
      return <MatchActivity lesson={lesson} onSpeak={onSpeak} />;
    case 'circle':
      return <CircleActivity lesson={lesson} onSpeak={onSpeak} />;
    case 'trace':
      return <TraceActivity lesson={lesson} onSpeak={onSpeak} />;
    case 'count':
      return <CountActivity lesson={lesson} onSpeak={onSpeak} />;
    case 'complete':
      return <CompleteActivity lesson={lesson} onSpeak={onSpeak} />;
    default:
      return null;
  }
};

/** Click a picture, then click its word (or the reverse). */
const MatchActivity: React.FC<ActivityProps> = ({ lesson, onSpeak }) => {
  const pairs = useMemo(
    () => lesson.words.slice(0, 4).map((word) => ({ ...word, id: word.en })),
    [lesson],
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedPicture, setSelectedPicture] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  const settle = (word: string, picture: string) => {
    if (word === picture) {
      setMatched((current) => new Set(current).add(word));
      speechService.playSuccessChime();
      onSpeak(word);
    } else {
      setWrong(word);
      speechService.playErrorBuzz();
      window.setTimeout(() => setWrong(null), 500);
    }
  };

  const chooseWord = (word: string) => {
    if (matched.has(word)) return;
    if (selectedPicture) {
      settle(word, selectedPicture);
      setSelectedWord(null);
      setSelectedPicture(null);
    } else {
      setSelectedWord(word);
      onSpeak(word);
    }
  };

  const choosePicture = (picture: string) => {
    if (matched.has(picture)) return;
    if (selectedWord) {
      settle(selectedWord, picture);
      setSelectedWord(null);
      setSelectedPicture(null);
    } else {
      setSelectedPicture(picture);
    }
  };

  return (
    <div className="g1-match">
      <p className="g1-instruction">اربط كل صورة بالكلمة الصحيحة.</p>
      <div className="g1-match-columns">
        <div className="g1-match-col">
          {pairs.map((word) => (
            <button
              key={`pic-${word.id}`}
              type="button"
              className={`g1-match-pic ${matched.has(word.id) ? 'is-done' : ''} ${selectedPicture === word.id ? 'is-selected' : ''} ${wrong === word.id ? 'is-wrong' : ''}`}
              onClick={() => choosePicture(word.id)}
              disabled={matched.has(word.id)}
              aria-label={`صورة ${word.ar}`}
            >
              <span aria-hidden="true">{word.emoji}</span>
              {matched.has(word.id) && <Check className="g1-match-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div className="g1-match-col">
          {pairs.map((word) => (
            <button
              key={`word-${word.id}`}
              type="button"
              className={`g1-match-word ${matched.has(word.id) ? 'is-done' : ''} ${selectedWord === word.id ? 'is-selected' : ''} ${wrong === word.id ? 'is-wrong' : ''}`}
              onClick={() => chooseWord(word.id)}
              disabled={matched.has(word.id)}
            >
              <strong dir="ltr">{word.en}</strong>
              <small>{word.ar}</small>
            </button>
          ))}
        </div>
      </div>
      {matched.size === pairs.length && <p className="g1-success">أحسنت! ربطت كل الكلمات 🎉</p>}
    </div>
  );
};

/** Circle the word that names the picture. */
const CircleActivity: React.FC<ActivityProps> = ({ lesson, onSpeak }) => {
  const target = lesson.words[0];
  const options = useMemo(() => lesson.words.slice(0, 3), [lesson]);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (word: Grade1Word) => {
    setPicked(word.en);
    if (word.en === target.en) {
      speechService.playSuccessChime();
    } else {
      speechService.playErrorBuzz();
    }
    onSpeak(word.en);
  };

  return (
    <div className="g1-circle">
      <p className="g1-instruction">اختر الكلمة الصحيحة للصورة:</p>
      <div className="g1-circle-picture" aria-hidden="true">{target.emoji}</div>
      <div className="g1-circle-options">
        {options.map((word) => {
          const isPicked = picked === word.en;
          const isCorrect = word.en === target.en;
          return (
            <button
              key={word.en}
              type="button"
              className={`g1-circle-option ${isPicked ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}
              onClick={() => choose(word)}
            >
              <strong dir="ltr">{word.en}</strong>
              {isPicked && (isCorrect ? <Check aria-hidden="true" /> : <X aria-hidden="true" />)}
            </button>
          );
        })}
      </div>
      {picked === target.en && <p className="g1-success">إجابة صحيحة! 🌟</p>}
    </div>
  );
};

/** Finger tracing over a dotted word. */
const TraceActivity: React.FC<ActivityProps> = ({ lesson, onSpeak }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const word = lesson.words[0]?.en ?? '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#7c3aed';
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const pos = point(event);
    if (!ctx || !pos) return;
    drawing.current = true;
    setHasInk(true);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    canvasRef.current?.setPointerCapture(event.pointerId);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    event.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const pos = point(event);
    if (!ctx || !pos) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
    speechService.playPop();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
  };

  return (
    <div className="g1-trace">
      <p className="g1-instruction">اكتب الكلمة بإصبعك فوق النقاط:</p>
      <div className="g1-trace-stage">
        <span className="g1-trace-guide" dir="ltr" aria-hidden="true">{word}</span>
        <canvas
          ref={canvasRef}
          className="g1-trace-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          aria-label={`اكتب ${word}`}
        />
      </div>
      <div className="g1-trace-actions">
        <button type="button" className="g1-retry" onClick={clear}>
          <RotateCcw aria-hidden="true" /> مسح
        </button>
        <button type="button" className="g1-retry" onClick={() => onSpeak(word)}>
          <Volume2 aria-hidden="true" /> اسمع
        </button>
      </div>
      {hasInk && <p className="g1-success">كتابة رائعة! ✏️</p>}
    </div>
  );
};

/** Count the objects and choose the number. */
const CountActivity: React.FC<ActivityProps> = ({ lesson, onSpeak }) => {
  const count = lesson.count ?? 3;
  const emoji = lesson.countEmoji ?? lesson.words[0]?.emoji ?? '⭐';
  const choices = useMemo(() => {
    const base = new Set<number>([count]);
    let value = 1;
    while (base.size < 4) {
      base.add(((count + value * 3) % 10) + 1);
      value += 1;
    }
    return [...base].sort((a, b) => a - b);
  }, [count]);
  const [picked, setPicked] = useState<number | null>(null);

  const choose = (value: number) => {
    setPicked(value);
    if (value === count) speechService.playSuccessChime();
    else speechService.playErrorBuzz();
  };

  return (
    <div className="g1-count">
      <p className="g1-instruction">عُدّ العناصر واختر الرقم الصحيح:</p>
      <div className="g1-count-stage" aria-label={`${count} عناصر`}>
        {Array.from({ length: count }, (_, index) => (
          <span key={index} aria-hidden="true">{emoji}</span>
        ))}
      </div>
      <div className="g1-count-options">
        {choices.map((value) => (
          <button
            key={value}
            type="button"
            className={`g1-count-option ${picked === value ? (value === count ? 'is-correct' : 'is-wrong') : ''}`}
            onClick={() => choose(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {picked === count && <p className="g1-success">عدد صحيح! {count} 🎉</p>}
    </div>
  );
};

/** Fill the missing letter. */
const CompleteActivity: React.FC<ActivityProps> = ({ lesson, onSpeak }) => {
  const word = lesson.completeWord ?? lesson.words[0]?.en ?? '';
  const missingIndex = lesson.completeIndex ?? Math.floor(word.length / 2);
  const correct = word[missingIndex] ?? '';
  const options = useMemo(() => {
    const pool = new Set<string>([correct, 'a', 'e', 'o', 'i', 'u', 'b', 'g']);
    pool.delete(correct);
    const distractors = [...pool].filter((letter) => letter !== correct).slice(0, 3);
    return shuffleLetters([correct, ...distractors]);
  }, [correct]);
  const [picked, setPicked] = useState<string | null>(null);
  const display = `${word.slice(0, missingIndex)}_${word.slice(missingIndex + 1)}`;

  const choose = (letter: string) => {
    setPicked(letter);
    if (letter === correct) {
      speechService.playSuccessChime();
      onSpeak(word);
    } else {
      speechService.playErrorBuzz();
    }
  };

  return (
    <div className="g1-complete">
      <p className="g1-instruction">أكمل الحرف الناقص:</p>
      <div className="g1-complete-stage">
        <span className="g1-complete-emoji" aria-hidden="true">{lesson.words[0]?.emoji}</span>
        <span className="g1-complete-word" dir="ltr">{display}</span>
        <small dir="ltr">{word}</small>
      </div>
      <div className="g1-complete-options">
        {options.map((letter) => (
          <button
            key={letter}
            type="button"
            className={`g1-complete-option ${picked === letter ? (letter === correct ? 'is-correct' : 'is-wrong') : ''}`}
            onClick={() => choose(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      {picked === correct && <p className="g1-success">الكلمة صحيحة: {word} ✨</p>}
    </div>
  );
};

const shuffleLetters = (letters: string[]): string[] => {
  const result = [...letters];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};
