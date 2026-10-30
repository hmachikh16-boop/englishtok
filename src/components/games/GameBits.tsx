import React, { type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Flame,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { percent } from './gameUtils';

export type GameAccent = 'emerald' | 'gold' | 'blue' | 'rose' | 'violet' | 'teal';

export interface GameFrameProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  onBack: () => void;
  current: number;
  total: number;
  score: number;
  scoreLabel?: string;
  progressLabel?: string;
  timer?: { value: number; total: number };
  accent?: GameAccent;
  children: ReactNode;
  footerNote?: string;
}

export const GameFrame: React.FC<GameFrameProps> = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  onBack,
  current,
  total,
  score,
  scoreLabel = 'نقاط',
  progressLabel,
  timer,
  accent = 'gold',
  children,
  footerNote,
}) => {
  const progress = percent(current, total);

  return (
    <div className={`gg-game-screen gg-accent-${accent}`}>
      <div className="gg-game-topbar">
        <button
          type="button"
          className="gg-back"
          onClick={onBack}
          aria-label="العودة إلى مكتبة الألعاب"
        >
          <ArrowRight aria-hidden="true" />
          <span>الألعاب</span>
        </button>
        <span className="gg-game-eyebrow">
          <Icon aria-hidden="true" />
          {eyebrow}
        </span>
        <span className="gg-game-score">
          <Star aria-hidden="true" />
          <strong>{score.toLocaleString('en-US')}</strong>
          <small>{scoreLabel}</small>
        </span>
      </div>

      <header className="gg-game-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <div className="gg-progress-wrap">
        <div className="gg-progress-labels">
          <span>{progressLabel ?? `السؤال ${Math.min(current + 1, total || 1)} من ${total || 1}`}</span>
          <span>{progress}%</span>
        </div>
        <div
          className="gg-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={progressLabel ?? 'تقدم اللعبة'}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        {timer && (
          <span className={`gg-timer ${timer.value <= 3 ? 'is-low' : ''}`}>
            <Timer aria-hidden="true" />
            {timer.value} ثانية
          </span>
        )}
      </div>

      <div className="gg-game-body">{children}</div>

      {footerNote && (
        <p className="gg-game-note">
          <Sparkles aria-hidden="true" />
          {footerNote}
        </p>
      )}
    </div>
  );
};

export interface GameFeedbackProps {
  correct: boolean;
  answer: string;
  translation: string;
  example?: string;
  exampleAr?: string;
  onListen: () => void;
  onNext: () => void;
  nextLabel?: string;
  wrongTitle?: string;
}

export const GameFeedback: React.FC<GameFeedbackProps> = ({
  correct,
  answer,
  translation,
  example,
  exampleAr,
  onListen,
  onNext,
  nextLabel = 'السؤال التالي',
  wrongTitle = 'ليست الإجابة الصحيحة',
}) => (
  <div
    className={`gg-feedback ${correct ? 'is-correct' : 'is-wrong'}`}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <span className="gg-feedback-mark" aria-hidden="true">
      {correct ? <Check /> : <X />}
    </span>
    <div className="gg-feedback-copy">
      <strong>{correct ? 'أحسنت، إجابة صحيحة' : wrongTitle}</strong>
      <p className="gg-feedback-answer" dir="ltr">
        {answer}
      </p>
      <p className="gg-feedback-translation">{translation}</p>
      {example && (
        <div className="gg-feedback-example">
          <p dir="ltr">{example}</p>
          {exampleAr && <p>{exampleAr}</p>}
        </div>
      )}
    </div>
    <div className="gg-feedback-actions">
      <button type="button" className="gg-soft-btn" onClick={onListen}>
        <Volume2 aria-hidden="true" />
        استمع
      </button>
      <button type="button" className="gg-next-btn" onClick={onNext}>
        {nextLabel}
        <ChevronLeft aria-hidden="true" />
      </button>
    </div>
  </div>
);

export interface GameResultProps {
  score: number;
  total: number;
  xp: number;
  bestStreak?: number;
  onReplay: () => void;
  onBack: () => void;
  title?: string;
  detail?: string;
}

export const GameResult: React.FC<GameResultProps> = ({
  score,
  total,
  xp,
  bestStreak,
  onReplay,
  onBack,
  title,
  detail,
}) => {
  const accuracy = percent(score, total);
  const headline = title ?? (accuracy >= 80 ? 'أداء رائع!' : accuracy >= 50 ? 'جلسة جيدة!' : 'واصل التدريب!');

  return (
    <section className="gg-result-panel" role="status" aria-live="polite">
      <div
        className="gg-result-ring"
        style={{
          background: `conic-gradient(var(--rt-gold-500) ${accuracy * 3.6}deg, rgb(27 46 63 / 12%) 0deg)`,
        }}
      >
        <div>
          <strong>{accuracy}%</strong>
          <span>دقة</span>
        </div>
      </div>
      <span className="gg-result-kicker">انتهت الجلسة</span>
      <h2>{headline}</h2>
      <p className="gg-result-detail">
        {detail ?? `${score.toLocaleString('en-US')} من ${total.toLocaleString('en-US')} إجابات صحيحة`}
      </p>

      <div className="gg-result-stats">
        <div>
          <Star aria-hidden="true" />
          <strong>+{xp.toLocaleString('en-US')}</strong>
          <span>XP</span>
        </div>
        {typeof bestStreak === 'number' && (
          <div>
            <Flame aria-hidden="true" />
            <strong>{bestStreak.toLocaleString('en-US')}</strong>
            <span>أفضل سلسلة</span>
          </div>
        )}
      </div>

      <div className="gg-result-actions">
        <button type="button" className="gg-primary" onClick={onReplay}>
          <RotateCcw aria-hidden="true" />
          العب مرة أخرى
        </button>
        <button type="button" className="gg-secondary" onClick={onBack}>
          <LayoutGrid aria-hidden="true" />
          لعبة أخرى
        </button>
      </div>
    </section>
  );
};

export const GameEmpty: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="gg-game-wrap">
    <section className="gg-empty-panel">
      <span className="gg-empty-icon" aria-hidden="true">
        <Trophy />
      </span>
      <h2>ستظهر اللعبة بعد تحميل المنهج</h2>
      <p>انتظر اكتمال تحميل دروس Gold ثم عد إلى مكتبة الألعاب.</p>
      <button type="button" className="gg-primary" onClick={onBack}>
        <ArrowRight aria-hidden="true" />
        العودة للألعاب
      </button>
    </section>
  </div>
);
