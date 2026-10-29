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

  const statCards = [
    { icon: Heart, label: 'القلوب', value: '∞', note: 'بلا حدود', tone: 'text-rose-600' },
    { icon: Gem, label: 'الجواهر', value: metrics.gems.toLocaleString('en-US'), note: 'من تقدمك', tone: 'text-cyan-700' },
    { icon: Crown, label: 'التيجان', value: metrics.crowns.toLocaleString('en-US'), note: 'مشاريع واختبارات', tone: 'text-amber-700' },
    { icon: Flame, label: 'السلسلة', value: userProfile.streakDays.toLocaleString('en-US'), note: 'يوم تعلّم', tone: 'text-orange-600' },
  ];

  return (
    <section
      className="gold-journey-panel relative overflow-hidden rounded-[2rem] border-2 border-[var(--rt-gold-500)] bg-[var(--rt-cream-50)] p-4 text-[var(--rt-blue-900)] shadow-2xl sm:p-5"
      dir="rtl"
      aria-label="لوحة Gold+"
    >
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[var(--rt-gold-400)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[var(--rt-blue-300)]/20 blur-3xl" />

      <section className="games-hero">
        <div className="games-hero-glow games-hero-glow-a" aria-hidden="true" />
        <div className="games-hero-glow games-hero-glow-b" aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <span className="games-kicker">
              <Crown className="h-4 w-4" aria-hidden="true" />
              Gold+
            </span>
            <h2 className="games-hero-title">تجربتك الذهبية اليوم</h2>
            <p className="games-hero-copy">
              تدريب بصري، نطق موسّع، قلوب لا نهائية، ومكافآت إضافية — أكثر من 70% أنشطة إضافية داخل رحلتك.
            </p>
          </div>
          <span className="games-hero-mascot" aria-hidden="true">
            <Crown className="h-9 w-9" />
          </span>
        </div>

        <div className="games-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="games-stat">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <span className="opacity-70">{stat.note}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border-2 border-[var(--rt-gold-500)] bg-[var(--rt-cream-50)] p-3.5 shadow-[0_3px_0_var(--rt-gold-700)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--rt-gold-500)] text-[var(--rt-blue-950)] shadow-lg shadow-amber-300/10">
                <Trophy className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <strong className="text-sm font-black text-[var(--rt-blue-950)]">{metrics.league.titleAr}</strong>
                  <span className="rounded-full bg-[var(--rt-blue-100)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[var(--rt-gold-700)]">
                    Gold League
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[var(--rt-blue-700)]">
                  {metrics.league.isTopTier
                    ? 'وصلت إلى أعلى دوري — حافظ على سلسلتك.'
                    : `بقي ${Math.max(0, (metrics.league.nextXp ?? userProfile.xp) - userProfile.xp)} XP للدوري التالي`}
                </p>
              </div>
            </div>
            <div className="font-mono-num text-left text-lg font-black text-[var(--rt-gold-700)]">
              {userProfile.xp}
              <span className="mr-1 text-[9px] font-bold text-[var(--rt-blue-700)]">XP</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--rt-cream-200)]">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[var(--rt-gold-500)] via-[var(--rt-gold-400)] to-[var(--rt-gold-600)] transition-[width] duration-700"
              style={{ width: `${metrics.league.progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-[var(--rt-blue-700)]">
            <span>{metrics.league.titleEn}</span>
            <span>{metrics.league.progressPercent}%</span>
            <span>{metrics.league.nextXp ? `${metrics.league.nextXp} XP` : 'القمة'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rt-cream-300)] bg-[var(--rt-cream-100)] p-3.5 shadow-[0_3px_0_var(--rt-cream-300)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-[var(--rt-blue-950)]">
              <Gift className="h-4 w-4 text-[var(--rt-gold-600)]" aria-hidden="true" />
              صندوق Gold اليومي
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${chestClaimed ? 'bg-emerald-100 text-emerald-700' : metrics.dailyChestReady ? 'bg-[var(--rt-gold-200)] text-[var(--rt-gold-700)]' : 'bg-[var(--rt-cream-200)] text-[var(--rt-blue-700)]'}`}>
              {chestClaimed ? 'تم الفتح' : metrics.dailyChestReady ? 'جاهز' : 'قيد التقدم'}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-[var(--rt-blue-700)]">
            {chestClaimed
              ? 'أحسنت، عد غدًا لصندوق جديد.'
              : metrics.dailyChestReady
                ? 'أكملت هدف اليوم. افتح الصندوق لتحصل على +10 XP.'
                : `أنجز ${Math.max(0, metrics.dailyGoal - metrics.dailyLessons)} درسًا إضافيًا لفتح الصندوق.`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--rt-cream-200)]">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-lime-400 transition-[width] duration-700"
              style={{ width: `${Math.min(100, (metrics.dailyLessons / metrics.dailyGoal) * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={claimChest}
            disabled={!metrics.dailyChestReady || chestClaimed}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--rt-gold-500)] px-3 py-2 text-[10px] font-black text-[var(--rt-blue-950)] shadow-sm transition-all hover:bg-[var(--rt-gold-400)] active:scale-[.98] disabled:cursor-not-allowed disabled:bg-[var(--rt-cream-200)] disabled:text-[var(--rt-blue-700)]"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            {chestClaimed ? 'تم فتح صندوق اليوم' : metrics.dailyChestReady ? 'افتح الصندوق' : `${metrics.dailyLessons}/${metrics.dailyGoal} دروس`}
          </button>
        </div>
      </div>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border border-[var(--rt-cream-300)] bg-[var(--rt-cream-100)] p-3.5 shadow-[0_3px_0_var(--rt-cream-300)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-[var(--rt-blue-950)]">
              <Sparkles className="h-4 w-4 text-[var(--rt-gold-600)]" aria-hidden="true" />
              مهاراتك الأربع
            </div>
            <span className="text-[9px] font-bold text-[var(--rt-blue-700)]">Gold+</span>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {metrics.skills.map((skill) => {
              const Icon = skillIcon[skill.id];
              return (
                <div key={skill.id} className="rounded-xl border border-[var(--rt-cream-300)] bg-[var(--rt-cream-50)] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--rt-blue-900)]">
                      <Icon className="h-3.5 w-3.5 text-[var(--rt-gold-600)]" aria-hidden="true" />
                      {skill.titleAr}
                    </span>
                    <span className="font-mono-num text-[10px] font-black text-[var(--rt-gold-700)]">{skill.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--rt-cream-200)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-[var(--rt-gold-500)] transition-[width] duration-700"
                      style={{ width: `${skill.value}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[8px] text-[var(--rt-blue-700)]">{skill.detailAr}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rt-cream-300)] bg-[var(--rt-cream-100)] p-3.5 shadow-[0_3px_0_var(--rt-cream-300)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-[var(--rt-blue-950)]">
              <Crown className="h-4 w-4 text-[var(--rt-gold-600)]" aria-hidden="true" />
              مشاريع Gold التطبيقية
            </div>
            <span className="rounded-full bg-[var(--rt-gold-200)] px-2 py-0.5 text-[8px] font-bold text-[var(--rt-gold-700)]">
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
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-right transition-all ${completed ? 'border-emerald-300 bg-emerald-50' : locked ? 'border-[var(--rt-cream-300)] bg-[var(--rt-cream-200)] opacity-60' : 'border-[var(--rt-gold-400)] bg-[var(--rt-cream-50)] hover:border-[var(--rt-gold-600)] active:scale-[.99]'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-500 text-white' : locked ? 'bg-[var(--rt-cream-300)] text-[var(--rt-blue-700)]' : 'bg-[var(--rt-gold-500)] text-[var(--rt-blue-950)]'}`}>
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-black text-[var(--rt-blue-950)]">{project.titleAr}</span>
                    <span className="mt-0.5 block text-[8px] text-[var(--rt-blue-700)]">مشروع المرحلة {project.curriculumStage} · {statusLabel(status)}</span>
                  </span>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-[var(--rt-blue-700)]" aria-hidden="true" />
                </button>
              );
            })}
            {goldProjects.length === 0 && (
              <p className="rounded-xl border border-dashed border-[var(--rt-cream-300)] px-3 py-3 text-center text-[10px] text-[var(--rt-blue-700)]">
                ستظهر مشاريع Gold هنا بعد تحميل المنهج.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex items-start gap-2.5 rounded-2xl border border-[var(--rt-gold-400)] bg-[var(--rt-cream-100)] px-3 py-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--rt-gold-200)] text-[var(--rt-gold-700)]">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[10px] font-black text-[var(--rt-blue-950)]">نصيحة Gold: {tip.title}</strong>
            <span className="rounded-full bg-[var(--rt-cream-200)] px-1.5 py-0.5 text-[8px] text-[var(--rt-blue-700)]">نصيحة {(tipIndex % TIPS.length) + 1}/{TIPS.length}</span>
          </div>
          <p className="mt-0.5 text-[9px] leading-5 text-[var(--rt-blue-700)]">{tip.body}</p>
        </div>
        <button
          type="button"
          onClick={() => setTipIndex((index) => (index + 1) % TIPS.length)}
          className="shrink-0 rounded-lg border border-[var(--rt-cream-300)] bg-[var(--rt-cream-50)] p-1.5 text-[var(--rt-blue-700)] transition-colors hover:bg-[var(--rt-cream-200)] hover:text-[var(--rt-blue-950)]"
          aria-label="اعرض نصيحة Gold أخرى"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {chestOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--rt-blue-950)]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="صندوق Gold اليومي">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border-2 border-[var(--rt-gold-500)] bg-[var(--rt-cream-50)] p-6 text-center shadow-2xl">
            <div className="gold-result-confetti" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, index) => (
                <span key={index} style={{ '--i': index } as React.CSSProperties} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setChestOpen(false)}
              className="absolute left-3 top-3 rounded-full bg-[var(--rt-cream-200)] p-1.5 text-[var(--rt-blue-700)] hover:text-[var(--rt-blue-950)]"
              aria-label="إغلاق صندوق Gold"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--rt-gold-500)] text-[var(--rt-blue-950)] shadow-2xl shadow-amber-300/25">
              <Gift className="h-10 w-10" strokeWidth={2.2} />
            </div>
            <span className="relative mt-4 inline-flex items-center gap-1 rounded-full border border-[var(--rt-gold-500)] bg-[var(--rt-gold-200)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--rt-gold-700)]">
              <Crown className="h-3 w-3" /> Gold+ Reward
            </span>
            <h3 className="relative mt-2 text-xl font-black text-[var(--rt-blue-950)]">فتحت صندوق اليوم!</h3>
            <p className="relative mt-1 text-xs leading-6 text-[var(--rt-blue-700)]">حصلت على <strong className="text-[var(--rt-gold-700)]">+10 XP</strong> إضافية. عد غدًا بعد إكمال هدفك اليومي.</p>
            <button
              type="button"
              onClick={() => setChestOpen(false)}
              className="relative mt-4 w-full rounded-xl bg-[var(--rt-gold-500)] px-4 py-2.5 text-xs font-black text-[var(--rt-blue-950)] hover:bg-[var(--rt-gold-400)] active:scale-[.98]"
            >
              رائع، تابع التعلّم
            </button>
          </div>
        </div>
      )}
    </section>
  );
};