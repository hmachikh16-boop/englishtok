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
      className="gold-journey-panel relative overflow-hidden rounded-[2rem] border-2 border-[var(--rt-gold-500)] bg-[#182c3f] p-4 text-[#fffaf0] shadow-2xl sm:p-5"
      dir="rtl"
      aria-label="لوحة Gold+"
    >
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[var(--rt-gold-400)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[var(--rt-blue-300)]/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--rt-gold-500)] bg-gradient-to-br from-[#1f3950] to-[#132230] p-4 shadow-[0_3px_0_#986200]">
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[var(--rt-gold-400)]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[var(--rt-blue-300)]/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--rt-gold-500)] bg-[var(--rt-gold-500)]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--rt-gold-400)]">
              <Crown className="h-3 w-3" strokeWidth={2.8} aria-hidden="true" />
              Gold+
            </span>
            <h2 className="mt-2 text-lg font-black text-[#fffaf0] sm:text-xl">تجربتك الذهبية اليوم</h2>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#d4e1ec]">
              تدريب بصري، نطق موسّع، قلوب لا نهائية، ومكافآت إضافية — أكثر من 70% أنشطة إضافية داخل رحلتك.
            </p>
          </div>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe27a] to-[var(--rt-gold-500)] text-[#132230] shadow-lg shadow-amber-900/30">
            <Crown className="h-8 w-8" strokeWidth={2.4} aria-hidden="true" />
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-[#315a7c] bg-[#182c3f] px-3 py-2.5 shadow-[0_2px_0_#12202e]">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${stat.tone}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {stat.label}
                </div>
                <div className="mt-1 text-xl font-black font-mono-num text-[#fffaf0]">{stat.value}</div>
                <div className="text-[9px] text-[#93b3cd]">{stat.note}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border-2 border-[var(--rt-gold-500)] bg-[#182c3f] p-3.5 shadow-[0_3px_0_var(--rt-gold-700)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--rt-gold-500)] text-[#fffaf0] shadow-lg shadow-amber-300/10">
                <Trophy className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <strong className="text-sm font-black text-[#fffaf0]">{metrics.league.titleAr}</strong>
                  <span className="rounded-full bg-[var(--rt-blue-100)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[var(--rt-gold-700)]">
                    Gold League
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#d4e1ec]">
                  {metrics.league.isTopTier
                    ? 'وصلت إلى أعلى دوري — حافظ على سلسلتك.'
                    : `بقي ${Math.max(0, (metrics.league.nextXp ?? userProfile.xp) - userProfile.xp)} XP للدوري التالي`}
                </p>
              </div>
            </div>
            <div className="font-mono-num text-left text-lg font-black text-[var(--rt-gold-700)]">
              {userProfile.xp}
              <span className="mr-1 text-[9px] font-bold text-[#d4e1ec]">XP</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#284965]">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[var(--rt-gold-500)] via-[var(--rt-gold-400)] to-[var(--rt-gold-600)] transition-[width] duration-700"
              style={{ width: `${metrics.league.progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-[#d4e1ec]">
            <span>{metrics.league.titleEn}</span>
            <span>{metrics.league.progressPercent}%</span>
            <span>{metrics.league.nextXp ? `${metrics.league.nextXp} XP` : 'القمة'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#315a7c] bg-[#1f3950] p-3.5 shadow-[0_3px_0_#12202e]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-[#fffaf0]">
              <Gift className="h-4 w-4 text-[var(--rt-gold-600)]" aria-hidden="true" />
              صندوق Gold اليومي
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${chestClaimed ? 'bg-emerald-100 text-emerald-700' : metrics.dailyChestReady ? 'bg-[var(--rt-gold-200)] text-[var(--rt-gold-700)]' : 'bg-[#284965] text-[#d4e1ec]'}`}>
              {chestClaimed ? 'تم الفتح' : metrics.dailyChestReady ? 'جاهز' : 'قيد التقدم'}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-[#d4e1ec]">
            {chestClaimed
              ? 'أحسنت، عد غدًا لصندوق جديد.'
              : metrics.dailyChestReady
                ? 'أكملت هدف اليوم. افتح الصندوق لتحصل على +10 XP.'
                : `أنجز ${Math.max(0, metrics.dailyGoal - metrics.dailyLessons)} درسًا إضافيًا لفتح الصندوق.`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#284965]">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-lime-400 transition-[width] duration-700"
              style={{ width: `${Math.min(100, (metrics.dailyLessons / metrics.dailyGoal) * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={claimChest}
            disabled={!metrics.dailyChestReady || chestClaimed}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--rt-gold-500)] px-3 py-2 text-[10px] font-black text-[#fffaf0] shadow-sm transition-all hover:bg-[var(--rt-gold-400)] active:scale-[.98] disabled:cursor-not-allowed disabled:bg-[#284965] disabled:text-[#d4e1ec]"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            {chestClaimed ? 'تم فتح صندوق اليوم' : metrics.dailyChestReady ? 'افتح الصندوق' : `${metrics.dailyLessons}/${metrics.dailyGoal} دروس`}
          </button>
        </div>
      </div>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border border-[#315a7c] bg-[#1f3950] p-3.5 shadow-[0_3px_0_#12202e]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-[#fffaf0]">
              <Sparkles className="h-4 w-4 text-[var(--rt-gold-600)]" aria-hidden="true" />
              مهاراتك الأربع
            </div>
            <span className="text-[9px] font-bold text-[#d4e1ec]">Gold+</span>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {metrics.skills.map((skill) => {
              const Icon = skillIcon[skill.id];
              return (
                <div key={skill.id} className="rounded-xl border border-[#315a7c] bg-[#182c3f] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#fffaf0]">
                      <Icon className="h-3.5 w-3.5 text-[var(--rt-gold-600)]" aria-hidden="true" />
                      {skill.titleAr}
                    </span>
                    <span className="font-mono-num text-[10px] font-black text-[var(--rt-gold-700)]">{skill.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#284965]">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-[var(--rt-gold-500)] transition-[width] duration-700"
                      style={{ width: `${skill.value}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[8px] text-[#d4e1ec]">{skill.detailAr}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#315a7c] bg-[#1f3950] p-3.5 shadow-[0_3px_0_#12202e]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-[#fffaf0]">
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
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-right transition-all ${completed ? 'border-emerald-300 bg-emerald-50' : locked ? 'border-[#315a7c] bg-[#284965] opacity-60' : 'border-[var(--rt-gold-400)] bg-[#182c3f] hover:border-[var(--rt-gold-600)] active:scale-[.99]'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-500 text-white' : locked ? 'bg-[var(--rt-cream-300)] text-[#d4e1ec]' : 'bg-[var(--rt-gold-500)] text-[#fffaf0]'}`}>
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-black text-[#fffaf0]">{project.titleAr}</span>
                    <span className="mt-0.5 block text-[8px] text-[#d4e1ec]">مشروع المرحلة {project.curriculumStage} · {statusLabel(status)}</span>
                  </span>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-[#d4e1ec]" aria-hidden="true" />
                </button>
              );
            })}
            {goldProjects.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#315a7c] px-3 py-3 text-center text-[10px] text-[#d4e1ec]">
                ستظهر مشاريع Gold هنا بعد تحميل المنهج.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex items-start gap-2.5 rounded-2xl border border-[var(--rt-gold-400)] bg-[#1f3950] px-3 py-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--rt-gold-200)] text-[var(--rt-gold-700)]">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[10px] font-black text-[#fffaf0]">نصيحة Gold: {tip.title}</strong>
            <span className="rounded-full bg-[#284965] px-1.5 py-0.5 text-[8px] text-[#d4e1ec]">نصيحة {(tipIndex % TIPS.length) + 1}/{TIPS.length}</span>
          </div>
          <p className="mt-0.5 text-[9px] leading-5 text-[#d4e1ec]">{tip.body}</p>
        </div>
        <button
          type="button"
          onClick={() => setTipIndex((index) => (index + 1) % TIPS.length)}
          className="shrink-0 rounded-lg border border-[#315a7c] bg-[#182c3f] p-1.5 text-[#d4e1ec] transition-colors hover:bg-[#284965] hover:text-[#fffaf0]"
          aria-label="اعرض نصيحة Gold أخرى"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {chestOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--rt-blue-950)]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="صندوق Gold اليومي">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border-2 border-[var(--rt-gold-500)] bg-[#182c3f] p-6 text-center shadow-2xl">
            <div className="gold-result-confetti" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, index) => (
                <span key={index} style={{ '--i': index } as React.CSSProperties} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setChestOpen(false)}
              className="absolute left-3 top-3 rounded-full bg-[#284965] p-1.5 text-[#d4e1ec] hover:text-[#fffaf0]"
              aria-label="إغلاق صندوق Gold"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--rt-gold-500)] text-[#fffaf0] shadow-2xl shadow-amber-300/25">
              <Gift className="h-10 w-10" strokeWidth={2.2} />
            </div>
            <span className="relative mt-4 inline-flex items-center gap-1 rounded-full border border-[var(--rt-gold-500)] bg-[var(--rt-gold-200)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--rt-gold-700)]">
              <Crown className="h-3 w-3" /> Gold+ Reward
            </span>
            <h3 className="relative mt-2 text-xl font-black text-[#fffaf0]">فتحت صندوق اليوم!</h3>
            <p className="relative mt-1 text-xs leading-6 text-[#d4e1ec]">حصلت على <strong className="text-[var(--rt-gold-700)]">+10 XP</strong> إضافية. عد غدًا بعد إكمال هدفك اليومي.</p>
            <button
              type="button"
              onClick={() => setChestOpen(false)}
              className="relative mt-4 w-full rounded-xl bg-[var(--rt-gold-500)] px-4 py-2.5 text-xs font-black text-[#fffaf0] hover:bg-[var(--rt-gold-400)] active:scale-[.98]"
            >
              رائع، تابع التعلّم
            </button>
          </div>
        </div>
      )}
    </section>
  );
};