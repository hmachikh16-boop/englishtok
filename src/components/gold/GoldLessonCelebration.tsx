import React from 'react';
import { Check, Crown, Gift, RotateCcw, Sparkles, Star } from 'lucide-react';
import type { Lesson } from '../../types';

interface GoldLessonCelebrationProps {
  lesson: Lesson;
  score: number;
  xp: number;
  bonusXp: number;
  correct: number;
  total: number;
  passed: boolean;
  onContinue: () => void;
  onRetry: () => void;
}

export const GoldLessonCelebration: React.FC<GoldLessonCelebrationProps> = ({
  lesson,
  score,
  xp,
  bonusXp,
  correct,
  total,
  passed,
  onContinue,
  onRetry,
}) => {
  const earnedStars = score >= 90 ? 3 : score >= 70 ? 2 : score > 0 ? 1 : 0;

  return (
    <div className="duo-result gold-lesson-result relative animate-scale-up" dir="rtl">
      <div className="gold-result-confetti" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, index) => (
          <span key={index} style={{ '--i': index } as React.CSSProperties} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-300/15 to-transparent" aria-hidden="true" />

      <span className="relative inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200">
        <Crown className="h-3 w-3" strokeWidth={2.8} aria-hidden="true" />
        Gold+ 1.1
      </span>

      <div className="duo-result-stars relative mt-3" aria-label={`${earnedStars} نجوم`}>
        {[0, 1, 2].map((star) => (
          <Star key={star} className={star < earnedStars ? 'earned' : ''} />
        ))}
      </div>

      <h1 className="duo-result-title relative">
        {passed ? 'أكملت الدرس!' : 'أنهيت الجولة!'}
      </h1>
      <p className="duo-result-lesson relative">{lesson.titleAr}</p>

      <div className="relative mx-auto mt-3 flex max-w-sm items-center gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2.5 text-right">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-amber-950 shadow-sm">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black text-amber-100">صندوق Gold مفتوح</div>
          <div className="mt-0.5 text-[9px] text-amber-100/70">
            +25% XP على المكافأة{bonusXp > 0 ? ` · +${bonusXp} XP من التحدي البصري` : ''}
          </div>
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
      </div>

      <div className="duo-result-stats relative">
        <div><strong>{score}%</strong><span>الدقة</span></div>
        <div><strong>{xp}</strong><span>XP مكتسب</span></div>
        <div><strong>{correct}/{total}</strong><span>إجابات صحيحة</span></div>
      </div>

      <p className="duo-result-hint relative">
        {passed
          ? 'تذكير Gold: راجع الكلمات الصعبة غدًا، ثم افتح تحديًا بصريًا جديدًا.'
          : 'لا بأس، أعد المحاولة. قلوب Gold لا تنفد، وكل محاولة تضيف كلمات للمراجعة.'}
      </p>

      <div className="duo-result-actions relative">
        {!passed && (
          <button type="button" onClick={onRetry} className="duo-btn duo-btn-secondary">
            <RotateCcw className="h-4 w-4" /> حاول مجدداً
          </button>
        )}
        <button type="button" onClick={onContinue} className="duo-btn duo-btn-primary">
          <Check className="h-4 w-4" /> تابع إلى المسار
        </button>
      </div>
    </div>
  );
};
