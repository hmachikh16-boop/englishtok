import React, { useMemo } from 'react';
import { Crown, Flame, Gem, Heart, Sparkles, Trophy } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import type { LearningPathState } from '../../services/learningPath';
import { getGoldMetrics } from '../../services/goldMetrics';

interface GoldLeagueCardProps {
  userProfile: UserProfile;
  lessons: Lesson[];
  learningPath: LearningPathState;
}

const LEAGUE_STEPS = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Diamond', 'Champion'] as const;

export const GoldLeagueCard: React.FC<GoldLeagueCardProps> = ({
  userProfile,
  lessons,
  learningPath,
}) => {
  const metrics = useMemo(
    () => getGoldMetrics(userProfile, lessons, learningPath),
    [learningPath, lessons, userProfile],
  );
  const currentIndex = Math.max(0, LEAGUE_STEPS.indexOf(metrics.league.titleEn as typeof LEAGUE_STEPS[number]));

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-[#171b22] p-4 text-slate-100 shadow-xl sm:p-5" dir="rtl" aria-label="دوري Gold">
      <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950 shadow-lg shadow-amber-400/20">
            <Trophy className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
          </span>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-amber-200">
              <Crown className="h-2.5 w-2.5" /> Gold+ League
            </span>
            <h3 className="mt-1 text-base font-black text-white">{metrics.league.titleAr}</h3>
            <p className="mt-0.5 text-[10px] text-slate-300">
              {metrics.league.isTopTier
                ? 'أنت في القمة — استمر في جمع XP.'
                : `${Math.max(0, (metrics.league.nextXp ?? userProfile.xp) - userProfile.xp)} XP للوصول إلى الدوري التالي`}
            </p>
          </div>
        </div>
        <div className="text-left font-mono-num">
          <div className="text-xl font-black text-amber-200">{userProfile.xp}</div>
          <div className="text-[9px] font-bold text-slate-400">XP الكلي</div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1" aria-label="مراحل دوري Gold">
        {LEAGUE_STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[8px] font-black ${
                index < currentIndex
                  ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-200'
                  : index === currentIndex
                    ? 'border-amber-200 bg-amber-300 text-amber-950 shadow-sm shadow-amber-300/30'
                    : 'border-white/10 bg-white/5 text-slate-500'
              }`}
              title={step}
            >
              {index < currentIndex ? '✓' : index + 1}
            </span>
            {index < LEAGUE_STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${index < currentIndex ? 'bg-emerald-300/40' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-400 transition-[width] duration-700"
          style={{ width: `${metrics.league.progressPercent}%` }}
        />
      </div>
      <div className="relative mt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
        <span>{metrics.league.titleEn}</span>
        <span>{metrics.league.progressPercent}%</span>
        <span>{metrics.league.nextXp ? `${metrics.league.nextXp} XP` : 'القمة'}</span>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-rose-200"><Heart className="h-3 w-3" fill="currentColor" /> القلوب</div>
          <div className="mt-0.5 font-mono-num text-lg font-black text-white">∞</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-200"><Gem className="h-3 w-3" /> الجواهر</div>
          <div className="mt-0.5 font-mono-num text-lg font-black text-white">{metrics.gems}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-200"><Crown className="h-3 w-3" /> التيجان</div>
          <div className="mt-0.5 font-mono-num text-lg font-black text-white">{metrics.crowns}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-orange-200"><Flame className="h-3 w-3" /> السلسلة</div>
          <div className="mt-0.5 font-mono-num text-lg font-black text-white">{userProfile.streakDays}</div>
        </div>
      </div>

      <div className="relative mt-3 flex items-start gap-2 rounded-xl border border-lime-300/20 bg-lime-300/[0.06] px-2.5 py-2 text-[9px] leading-5 text-slate-300">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-200" aria-hidden="true" />
        <span>مزايا Gold النشطة: قلوب لا نهائية، +25% XP، تحدي بصري إضافي، ونطق موسّع بجملتين.</span>
      </div>
    </section>
  );
};
