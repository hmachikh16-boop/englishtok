import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Gem,
  Gift,
  GraduationCap,
  Headphones,
  Heart,
  Lightbulb,
  Lock,
  Mic,
  Play,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import type { LearningPathState } from '../../services/learningPath';
import { getGoldMetrics } from '../../services/goldMetrics';

interface GoldJourneyPanelProps {
  userProfile: UserProfile;
  lessons: Lesson[];
  learningPath: LearningPathState;
  onSelectLesson: (lessonId: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const TIPS = [
  {
    title: 'استمع قبل أن تقرأ',
    body: 'في كل درس، شغّل الجملة مرة كاملة دون النظر إلى الترجمة. هذا يدرّب أذنك على الإيقاع قبل المعنى.',
  },
  {
    title: 'جملة واحدة كل يوم',
    body: 'اختر جملة من مشروع Gold وكرّرها بصوت مرتفع ثلاث مرات. التكرار القصير أفضل من جلسة طويلة متقطعة.',
  },
  {
    title: 'لا تهرب من الخطأ',
    body: 'الخطأ يضيف الكلمة إلى قائمة المراجعة تلقائيًا. راجع الكلمات الصعبة قبل الدرس التالي، لا بعده فقط.',
  },
  {
    title: 'استخدم الصورة كمرساة',
    body: 'اربط الكلمة بصورة أو موقف من حياتك. في تحدي Gold البصري، لاحظ الصورة قبل قراءة الخيارات.',
  },
] as const;

const CHEST_KEY = 'lin-go-gold-daily-chest';
const today = (): string => new Date().toISOString().slice(0, 10);

const readChestDate = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(CHEST_KEY) ?? '';
  } catch {
    return '';
  }
};

const skillIcon = {
  listening: Headphones,
  speaking: Mic,
  vocabulary: BookOpen,
  grammar: GraduationCap,
} as const;

const statusLabel = (status: string): string => {
  if (status === 'completed') return 'مكتمل';
  if (status === 'locked') return 'مقفل';
  if (status === 'current') return 'ابدأ الآن';
  return 'متاح';
};

export const GoldJourneyPanel: React.FC<GoldJourneyPanelProps> = ({
  userProfile,
  lessons,
  learningPath,
  onSelectLesson,
  onUpdateProfile,
}) => {
  const metrics = useMemo(
    () => getGoldMetrics(userProfile, lessons, learningPath),
    [learningPath, lessons, userProfile],
  );
  const goldProjects = useMemo(
    () => lessons.filter((lesson) => lesson.id.startsWith('gold-project-stage-')),
    [lessons],
  );
  const [tipIndex, setTipIndex] = useState(0);
  const [chestDate, setChestDate] = useState(readChestDate);
  const [chestOpen, setChestOpen] = useState(false);
  const tip = TIPS[tipIndex % TIPS.length];
  const chestClaimed = chestDate === today();

  const claimChest = () => {
    if (!metrics.dailyChestReady || chestClaimed) return;
    const date = today();
    try {
      window.localStorage.setItem(CHEST_KEY, date);
    } catch {
      /* The reward is still shown for this session if storage is unavailable. */
    }
    setChestDate(date);
    setChestOpen(true);
    onUpdateProfile({ xp: userProfile.xp + 10 });
  };

  return (
    <section
      className="gold-journey-panel relative overflow-hidden rounded-[2rem] border border-amber-300/25 bg-[#171b22] p-4 text-slate-100 shadow-2xl sm:p-5"
      dir="rtl"
      aria-label="لوحة Gold+"
    >
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200">
            <Crown className="h-3 w-3" strokeWidth={2.8} aria-hidden="true" />
            Gold+
          </span>
          <h2 className="mt-2 text-lg font-black text-white sm:text-xl">تجربتك الذهبية اليوم</h2>
          <p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-300">
            تدريب بصري، نطق موسّع، قلوب لا نهائية، ومكافآت إضافية — أكثر من 70% أنشطة إضافية داخل رحلتك.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="مزايا Gold النشطة">
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/30 bg-rose-300/10 px-2 py-1 text-[9px] font-bold text-rose-100">
            <Heart className="h-3 w-3" fill="currentColor" /> قلوب ∞
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[9px] font-bold text-amber-100">
            <Sparkles className="h-3 w-3" /> +25% XP
          </span>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: Heart, label: 'القلوب', value: '∞', note: 'بلا حدود', tone: 'text-rose-200' },
          { icon: Gem, label: 'الجواهر', value: metrics.gems.toLocaleString('en-US'), note: 'من تقدمك', tone: 'text-cyan-200' },
          { icon: Crown, label: 'التيجان', value: metrics.crowns.toLocaleString('en-US'), note: 'مشاريع واختبارات', tone: 'text-amber-200' },
          { icon: Flame, label: 'السلسلة', value: userProfile.streakDays.toLocaleString('en-US'), note: 'يوم تعلّم', tone: 'text-orange-200' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-sm"
            >
              <div className={`flex items-center gap-1.5 text-[10px] font-bold ${stat.tone}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {stat.label}
              </div>
              <div className="mt-1 text-xl font-black font-mono-num text-white">{stat.value}</div>
              <div className="text-[9px] text-slate-400">{stat.note}</div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-l from-amber-300/[0.12] to-transparent p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-amber-950 shadow-lg shadow-amber-300/10">
                <Trophy className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <strong className="text-sm font-black text-white">{metrics.league.titleAr}</strong>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-amber-200">
                    Gold League
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-300">
                  {metrics.league.isTopTier
                    ? 'وصلت إلى أعلى دوري — حافظ على سلسلتك.'
                    : `بقي ${Math.max(0, (metrics.league.nextXp ?? userProfile.xp) - userProfile.xp)} XP للدوري التالي`}
                </p>
              </div>
            </div>
            <div className="font-mono-num text-left text-lg font-black text-amber-200">
              {userProfile.xp}
              <span className="mr-1 text-[9px] font-bold text-slate-400">XP</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-400 transition-[width] duration-700"
              style={{ width: `${metrics.league.progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>{metrics.league.titleEn}</span>
            <span>{metrics.league.progressPercent}%</span>
            <span>{metrics.league.nextXp ? `${metrics.league.nextXp} XP` : 'القمة'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Gift className="h-4 w-4 text-amber-300" aria-hidden="true" />
              صندوق Gold اليومي
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${chestClaimed ? 'bg-emerald-300/15 text-emerald-200' : metrics.dailyChestReady ? 'bg-amber-300/20 text-amber-100' : 'bg-white/10 text-slate-300'}`}>
              {chestClaimed ? 'تم الفتح' : metrics.dailyChestReady ? 'جاهز' : 'قيد التقدم'}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-slate-300">
            {chestClaimed
              ? 'أحسنت، عد غدًا لصندوق جديد.'
              : metrics.dailyChestReady
                ? 'أكملت هدف اليوم. افتح الصندوق لتحصل على +10 XP.'
                : `أنجز ${Math.max(0, metrics.dailyGoal - metrics.dailyLessons)} درسًا إضافيًا لفتح الصندوق.`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-300 to-lime-300 transition-[width] duration-700"
              style={{ width: `${Math.min(100, (metrics.dailyLessons / metrics.dailyGoal) * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={claimChest}
            disabled={!metrics.dailyChestReady || chestClaimed}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-300 px-3 py-2 text-[10px] font-black text-amber-950 shadow-sm transition-all hover:bg-amber-200 active:scale-[.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            {chestClaimed ? 'تم فتح صندوق اليوم' : metrics.dailyChestReady ? 'افتح الصندوق' : `${metrics.dailyLessons}/${metrics.dailyGoal} دروس`}
          </button>
        </div>
      </div>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Sparkles className="h-4 w-4 text-lime-300" aria-hidden="true" />
              مهاراتك الأربع
            </div>
            <span className="text-[9px] font-bold text-slate-400">Gold+</span>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {metrics.skills.map((skill) => {
              const Icon = skillIcon[skill.id];
              return (
                <div key={skill.id} className="rounded-xl border border-white/10 bg-black/15 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                      <Icon className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
                      {skill.titleAr}
                    </span>
                    <span className="font-mono-num text-[10px] font-black text-amber-200">{skill.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-lime-300 to-emerald-300 transition-[width] duration-700"
                      style={{ width: `${skill.value}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[8px] text-slate-400">{skill.detailAr}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
              مشاريع Gold التطبيقية
            </div>
            <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[8px] font-bold text-amber-200">
              {metrics.goldProjectsCompleted}/{metrics.goldProjectsTotal || 4}
            </span>
          </div>
          <div className="mt-2.5 grid gap-1.5">
            {goldProjects.map((project) => {
              const status = learningPath.lessonStatusById.get(project.id) ?? 'locked';
              const completed = status === 'completed';
              const locked = status === 'locked';
              return (
                <button
                  key={project.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onSelectLesson(project.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-right transition-all ${completed ? 'border-emerald-300/25 bg-emerald-300/10' : locked ? 'border-white/10 bg-black/10 opacity-60' : 'border-amber-300/25 bg-amber-300/[0.08] hover:border-amber-300/50 active:scale-[.99]'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-300 text-emerald-950' : locked ? 'bg-white/10 text-slate-400' : 'bg-amber-300 text-amber-950'}`}>
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-black text-white">{project.titleAr}</span>
                    <span className="mt-0.5 block text-[8px] text-slate-400">مشروع المرحلة {project.curriculumStage} · {statusLabel(status)}</span>
                  </span>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                </button>
              );
            })}
            {goldProjects.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/15 px-3 py-3 text-center text-[10px] text-slate-400">
                ستظهر مشاريع Gold هنا بعد تحميل المنهج.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex items-start gap-2.5 rounded-2xl border border-lime-300/20 bg-lime-300/[0.06] px-3 py-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-300/15 text-lime-200">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[10px] font-black text-lime-100">نصيحة Gold: {tip.title}</strong>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] text-slate-300">نصيحة {(tipIndex % TIPS.length) + 1}/{TIPS.length}</span>
          </div>
          <p className="mt-0.5 text-[9px] leading-5 text-slate-300">{tip.body}</p>
        </div>
        <button
          type="button"
          onClick={() => setTipIndex((index) => (index + 1) % TIPS.length)}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="اعرض نصيحة Gold أخرى"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {chestOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="صندوق Gold اليومي">
          <div className="gold-chest-dialog relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-amber-300/40 bg-[#18221f] p-6 text-center shadow-2xl">
            <div className="gold-result-confetti" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, index) => (
                <span key={index} style={{ '--i': index } as React.CSSProperties} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setChestOpen(false)}
              className="absolute left-3 top-3 rounded-full bg-white/10 p-1.5 text-slate-300 hover:text-white"
              aria-label="إغلاق صندوق Gold"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-300 text-amber-950 shadow-2xl shadow-amber-300/25">
              <Gift className="h-10 w-10" strokeWidth={2.2} />
            </div>
            <span className="relative mt-4 inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-200">
              <Crown className="h-3 w-3" /> Gold+ Reward
            </span>
            <h3 className="relative mt-2 text-xl font-black text-white">فتحت صندوق اليوم!</h3>
            <p className="relative mt-1 text-xs leading-6 text-slate-300">حصلت على <strong className="text-amber-200">+10 XP</strong> إضافية. عد غدًا بعد إكمال هدفك اليومي.</p>
            <button
              type="button"
              onClick={() => setChestOpen(false)}
              className="relative mt-4 w-full rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-black text-amber-950 hover:bg-amber-200 active:scale-[.98]"
            >
              رائع، تابع التعلّم
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
