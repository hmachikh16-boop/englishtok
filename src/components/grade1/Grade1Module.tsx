import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Lock,
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

/** Worksheet colour names mapped to the actual swatch/fill colours. */
const COLOR_HEX: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#facc15',
  brown: '#a16207',
  black: '#1f2937',
  white: '#f8fafc',
  pink: '#ec4899',
  orange: '#f97316',
  purple: '#a855f7',
};

const colorHex = (name: string): string => COLOR_HEX[name] ?? '#cbd5e1';

/** Short haptic tick on devices that expose the Vibration API. */
const vibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore devices that block vibration.
  }
};

/**
 * Grade 1 module — a pastel, child-friendly English workbook.
 *
 * The module is intentionally self-contained: it does not depend on the main
 * curriculum or on any server asset. Words are illustrated with emoji, which
 * keeps the lesson readable offline and identical on phones and tablets.
 */
export const Grade1Module: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('g1_completed_v1');
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('g1_completed_v1', JSON.stringify([...completed]));
    } catch {
      // Ignore storage failures (private mode).
    }
  }, [completed]);

  const selected = useMemo(
    () => GRADE1_LESSONS.find((lesson) => lesson.id === selectedId) ?? null,
    [selectedId],
  );

  const isCompleted = useCallback((id: string) => completed.has(id), [completed]);

  const isUnlocked = useCallback(
    (lesson: Grade1Lesson) => {
      const idx = GRADE1_LESSONS.findIndex((item) => item.id === lesson.id);
      if (idx <= 0) return true;
      return completed.has(GRADE1_LESSONS[idx - 1].id);
    },
    [completed],
  );

  const markComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      speechService.playSuccessChime();
      return next;
    });
  }, []);

  const openLesson = (lesson: Grade1Lesson) => {
    if (!isUnlocked(lesson)) return;
    setSelectedId(lesson.id);
    speechService.playPop();
  };

  // Start every lesson (and the lesson list) from the top. The module lives
  // inside a non-scrolling flex shell, so this element is its own scroller.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [selectedId]);

  const completedCount = completed.size;
  const progressPct = Math.round((completedCount / GRADE1_LESSONS.length) * 100);

  if (selected) {
    return (
      <div className="g1-scroll" ref={scrollRef}>
        <Grade1LessonView
          lesson={selected}
          completed={isCompleted(selected.id)}
          unlocked={isUnlocked(selected)}
          onBack={() => setSelectedId(null)}
          onNavigate={(id) => {
            const target = GRADE1_LESSONS.find((l) => l.id === id);
            if (target && isUnlocked(target)) setSelectedId(id);
          }}
          onComplete={() => markComplete(selected.id)}
        />
      </div>
    );
  }

  return (
    <div className="g1-scroll" ref={scrollRef}>
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
          <span><strong>{completedCount}</strong>/{GRADE1_LESSONS.length} مكتمل</span>
          <span><strong>5</strong> وحدات</span>
          <span><strong>{progressPct}%</strong> تقدم</span>
        </div>
        <div className="g1-progress-bar" aria-label={`التقدم ${progressPct}%`}>
          <div className="g1-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      {GRADE1_UNITS.map((unit) => {
        const lessons = GRADE1_LESSONS.filter((lesson) => lesson.unit === unit.unit);
        const unitUnlocked =
          unit.unit === 1 ||
          GRADE1_LESSONS.filter((l) => l.unit === unit.unit - 1).every((l) => completed.has(l.id));
        const unitCompleted = lessons.every((l) => completed.has(l.id));
        const unitDoneCount = lessons.filter((l) => completed.has(l.id)).length;
        return (
          <section key={unit.unit} className="g1-unit" aria-labelledby={`g1-unit-${unit.unit}`}>
            <div className="g1-unit-head">
              <span className={`g1-unit-badge ${unitCompleted ? 'is-done' : unitUnlocked ? '' : 'is-locked'}`}>
                {unitCompleted ? <Check aria-hidden="true" /> : unitUnlocked ? unit.unit : <Lock aria-hidden="true" />}
              </span>
              <div>
                <h2 id={`g1-unit-${unit.unit}`}>{unit.unitAr}</h2>
                <p>
                  {unitUnlocked
                    ? `${unitDoneCount}/${lessons.length} مكتمل · أنشطة متنوعة`
                    : 'أكمل الوحدة السابقة لفتح هذه الوحدة'}
                </p>
              </div>
            </div>
            <div className="g1-lesson-grid">
              {lessons.map((lesson, index) => {
                const unlocked = unitUnlocked && isUnlocked(lesson);
                const done = completed.has(lesson.id);
                const isCurrent =
                  !done &&
                  unlocked &&
                  (index === 0 || completed.has(lessons[index - 1]?.id ?? ''));
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    disabled={!unlocked}
                    className={`g1-lesson-card ${index % 2 === 0 ? 'is-a' : 'is-b'} ${
                      done ? 'is-done' : isCurrent ? 'is-current' : unlocked ? '' : 'is-locked'
                    }`}
                    onClick={() => openLesson(lesson)}
                    aria-label={
                      unlocked
                        ? `${lesson.topicAr} — ${grade1ActivityLabel(lesson.activity)}`
                        : `${lesson.topicAr} — مقفل`
                    }
                  >
                    <span className="g1-lesson-emoji" aria-hidden="true">
                      {unlocked ? lesson.words[0]?.emoji : <Lock />}
                    </span>
                    <span className="g1-lesson-card-copy">
                      <strong>{lesson.topicAr}</strong>
                      <small>{grade1ActivityLabel(lesson.activity)}</small>
                    </span>
                    <span className="g1-lesson-status" aria-hidden="true">
                      {done ? <Check /> : unlocked ? <ArrowRight /> : <Lock />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Lesson screen                                                      */
/* ------------------------------------------------------------------ */

interface LessonViewProps {
  lesson: Grade1Lesson;
  completed: boolean;
  unlocked: boolean;
  onBack: () => void;
  onNavigate: (id: string) => void;
  onComplete: () => void;
}

const Grade1LessonView: React.FC<LessonViewProps> = ({ lesson, completed, onBack, onNavigate, onComplete }) => {
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
        <Activity key={`${lesson.id}-${activityKey}`} lesson={lesson} onSpeak={speak} onComplete={onComplete} />
      </section>

      <div className="g1-complete-row">
        {completed ? (
          <span className="g1-completed-chip"><Check aria-hidden="true" /> تم إكمال هذا الدرس</span>
        ) : (
          <button type="button" className="g1-complete-btn" onClick={onComplete}>
            <Check aria-hidden="true" /> أكملت الدرس
          </button>
        )}
      </div>

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
          disabled={!next || !completed}
          onClick={() => next && completed && onNavigate(next.id)}
          title={!completed ? 'أكمل الدرس أولًا للانتقال للتالي' : ''}
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
  onComplete: () => void;
}

const Activity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
  switch (lesson.activity) {
    case 'match':
      return <MatchActivity lesson={lesson} onSpeak={onSpeak} onComplete={onComplete} />;
    case 'circle':
      return <CircleActivity lesson={lesson} onSpeak={onSpeak} onComplete={onComplete} />;
    case 'trace':
      return <TraceActivity lesson={lesson} onSpeak={onSpeak} onComplete={onComplete} />;
    case 'count':
      return <CountActivity lesson={lesson} onSpeak={onSpeak} onComplete={onComplete} />;
    case 'complete':
      return <CompleteActivity lesson={lesson} onSpeak={onSpeak} onComplete={onComplete} />;
    case 'color':
      return <ColorActivity lesson={lesson} onSpeak={onSpeak} onComplete={onComplete} />;
    default:
      return null;
  }
};

/** Click a picture, then click its word (or the reverse). */
const MatchActivity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
  const pairs = useMemo(
    () => lesson.words.slice(0, 4).map((word) => ({ ...word, id: word.en })),
    [lesson],
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedPicture, setSelectedPicture] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  useEffect(() => {
    if (pairs.length > 0 && matched.size === pairs.length) onComplete();
  }, [matched, pairs, onComplete]);

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
const CircleActivity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
  const target = lesson.words[0];
  const options = useMemo(() => lesson.words.slice(0, 3), [lesson]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (picked === target.en) onComplete();
  }, [picked, target.en, onComplete]);

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

/**
 * Tap-to-colour worksheet.
 *
 * A child picks a colour from the palette, then taps any region of the scene.
 * The region fills instantly — no dragging, no finger painting. The balloon is
 * the lesson goal, so the target colour is reinforced without blocking free
 * colouring of the sky, sun, cloud, rainbow, basket or ground.
 */
const ColorRegion: React.FC<{
  label: string;
  onPaint: () => void;
  children: React.ReactNode;
}> = ({ label, onPaint, children }) => (
  <g
    className="g1-color-region"
    role="button"
    tabIndex={0}
    aria-label={label}
    onClick={onPaint}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPaint();
      }
    }}
  >
    {children}
  </g>
);

const ColorActivity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
  const palette = lesson.words;
  const target = palette[0];
  const targetHex = colorHex(target.en);
  const [selected, setSelected] = useState<string | null>(null);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [hint, setHint] = useState('');

  const fill = (region: string, fallback: string) => fills[region] ?? fallback;

  const chooseColor = (word: Grade1Word) => {
    setSelected(colorHex(word.en));
    setHint('');
    onSpeak(word.en);
  };

  const paint = (region: string) => {
    if (!selected) {
      setHint('اختر لونًا أولًا من اللوحة 🎨');
      return;
    }
    setFills((current) => ({ ...current, [region]: selected }));
    setHint('');
    speechService.playPop();
    vibrate(12);
    if (region === 'balloon' && selected === targetHex) {
      speechService.playSuccessChime();
      vibrate(35);
    }
  };

  const targetDone = fills.balloon === targetHex;
  const coloredCount = Object.keys(fills).length;

  useEffect(() => {
    if (targetDone) onComplete();
  }, [targetDone, onComplete]);

  return (
    <div className="g1-color">
      <p className="g1-instruction">اختر لونًا من اللوحة، ثم اضغط على أي جزء في الصورة ليُلوَّن فورًا.</p>

      <div className="g1-color-goal">
        <span>🎯 لوّن البالون باللون</span>
        <strong>{target.ar}</strong>
        <span dir="ltr">({target.en})</span>
      </div>

      <div className="g1-color-stage">
        <svg
          viewBox="0 0 320 240"
          className="g1-color-svg"
          role="img"
          aria-label="لوحة تلوين: سماء وشمس وسحابة وقوس قزح وبالون"
        >
          <ColorRegion label="السماء" onPaint={() => paint('sky')}>
            <rect x="0" y="0" width="320" height="240" rx="20" fill={fill('sky', '#ffffff')} />
          </ColorRegion>

          <ColorRegion label="الشمس" onPaint={() => paint('sun')}>
            <circle
              cx="54"
              cy="52"
              r="24"
              fill={fill('sun', '#f8fafc')}
              stroke="#334155"
              strokeWidth="3"
            />
          </ColorRegion>

          <ColorRegion label="السحابة" onPaint={() => paint('cloud')}>
            <path
              d="M205 68c-10 0-18-8-18-18s8-18 18-18c3 0 6 1 8 2 4-10 14-17 25-17 14 0 26 11 27 25 10 1 18 9 18 19 0 11-9 20-20 20h-58z"
              fill={fill('cloud', '#f8fafc')}
              stroke="#334155"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </ColorRegion>

          <ColorRegion label="قوس القزح الأول" onPaint={() => paint('rainbow1')}>
            <path
              d="M40 210 A120 120 0 0 1 280 210 L266 210 A106 106 0 0 0 54 210 Z"
              fill={fill('rainbow1', '#f1f5f9')}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </ColorRegion>
          <ColorRegion label="قوس القزح الثاني" onPaint={() => paint('rainbow2')}>
            <path
              d="M54 210 A106 106 0 0 1 266 210 L252 210 A92 92 0 0 0 68 210 Z"
              fill={fill('rainbow2', '#f1f5f9')}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </ColorRegion>
          <ColorRegion label="قوس القزح الثالث" onPaint={() => paint('rainbow3')}>
            <path
              d="M68 210 A92 92 0 0 1 252 210 L238 210 A78 78 0 0 0 82 210 Z"
              fill={fill('rainbow3', '#f1f5f9')}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </ColorRegion>
          <ColorRegion label="قوس القزح الرابع" onPaint={() => paint('rainbow4')}>
            <path
              d="M82 210 A78 78 0 0 1 238 210 L224 210 A64 64 0 0 0 96 210 Z"
              fill={fill('rainbow4', '#f1f5f9')}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </ColorRegion>

          <ColorRegion label="البالون" onPaint={() => paint('balloon')}>
            <circle
              cx="160"
              cy="170"
              r="22"
              fill={fill('balloon', '#f8fafc')}
              stroke="#334155"
              strokeWidth="3"
            />
            <path d="M157 191h6l-3 7z" fill="#334155" />
          </ColorRegion>

          <ColorRegion label="سلة البالون" onPaint={() => paint('basket')}>
            <rect
              x="149"
              y="197"
              width="22"
              height="14"
              rx="4"
              fill={fill('basket', '#f8fafc')}
              stroke="#334155"
              strokeWidth="3"
            />
          </ColorRegion>

          <ColorRegion label="الأرض" onPaint={() => paint('ground')}>
            <rect x="0" y="210" width="320" height="30" fill={fill('ground', '#f1f5f9')} />
          </ColorRegion>
        </svg>
      </div>

      {hint && <p className="g1-color-hint">{hint}</p>}

      <div className="g1-color-palette" role="group" aria-label="لوحة الألوان">
        {palette.map((word) => {
          const hex = colorHex(word.en);
          const isSelected = selected === hex;
          return (
            <button
              key={word.en}
              type="button"
              className={`g1-color-swatch ${isSelected ? 'is-selected' : ''} ${target.en === word.en ? 'is-target' : ''}`}
              onClick={() => chooseColor(word)}
              aria-pressed={isSelected}
            >
              <span className="g1-color-dot" style={{ background: hex }} aria-hidden="true" />
              <span className="g1-color-name">
                <strong dir="ltr">{word.en}</strong>
                <small>{word.ar}</small>
              </span>
              {target.en === word.en && <Star aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {targetDone && <p className="g1-success">أحسنت! لونت البالون باللون {target.ar} 🎈</p>}
      {!targetDone && coloredCount > 0 && (
        <p className="g1-color-progress">لونت {coloredCount} أجزاء — جرّب البالون باللون {target.ar}.</p>
      )}
    </div>
  );
};

/** Finger tracing over a dotted word. */
const TraceActivity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
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
const CountActivity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
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

  useEffect(() => {
    if (picked !== null && picked === count) onComplete();
  }, [picked, count, onComplete]);

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
const CompleteActivity: React.FC<ActivityProps> = ({ lesson, onSpeak, onComplete }) => {
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

  useEffect(() => {
    if (picked === correct) onComplete();
  }, [picked, correct, onComplete]);

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
