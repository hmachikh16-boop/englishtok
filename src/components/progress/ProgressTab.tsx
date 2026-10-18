import React from 'react';
import { 
  Flame, 
  Award, 
  Trophy, 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  Target,
  Coffee,
  Crown,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { UserProfile, Lesson } from '../../types';
import { getUserRank } from '../../services/storageService';
import { getLearningPathState } from '../../services/learningPath';
import { PremiumIcon, type PremiumIconName } from '../icons/PremiumIcon';

interface ProgressTabProps {
  userProfile: UserProfile;
  lessons: Lesson[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResumeLearning: () => void;
}

interface Badge {
  id: string;
  titleAr: string;
  descriptionAr: string;
  icon: PremiumIconName;
  isUnlocked: boolean;
  progressText: string;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  userProfile,
  lessons,
  onUpdateProfile,
  onResumeLearning,
}) => {
  const rank = getUserRank(userProfile.xp);
  const path = getLearningPathState(lessons, userProfile);

  // Compute stats
  const totalWatched = userProfile.watchedLessonIds.length;
  const totalLessons = lessons.length;
  const totalSavedWords = userProfile.savedWordIds.length;
  const totalMasteredWords = userProfile.masteredWordIds.length;
  const quizzesTaken = Object.keys(userProfile.quizScores).length;
  const today = new Date().toISOString().slice(0, 10);
  const dailyLessons = userProfile.dailyProgress.date === today
    ? userProfile.dailyProgress.completedLessonIds.length
    : 0;
  const examAttempts = Object.values(userProfile.levelExamResults).reduce((total, exam) => total + exam.attempts, 0);
  const reviewTopics = [...new Set(
    Object.values(userProfile.levelExamResults).flatMap((exam) => exam.reviewTopics)
  )];
  const reviewWords = userProfile.reviewWordIds
    .map((id) => lessons.flatMap((lesson) => lesson.vocabulary).find((word) => word.id === id))
    .filter((word): word is NonNullable<typeof word> => Boolean(word));

  // Achievement Badges
  const badges: Badge[] = [
    {
      id: 'b1',
      titleAr: 'أولى الخطوات',
      descriptionAr: 'شاهد أول فيديو تعليمي',
      icon: 'lesson',
      isUnlocked: totalWatched >= 1,
      progressText: `${Math.min(1, totalWatched)}/1`,
    },
    {
      id: 'b2',
      titleAr: 'شعلة الاستمرار',
      descriptionAr: 'سجّل التعلم في 3 أيام مختلفة؛ الانقطاع لا يمحو إنجازك',
      icon: 'streak',
      isUnlocked: userProfile.streakDays >= 3,
      progressText: `${Math.min(3, userProfile.streakDays)}/3 أيام`,
    },
    {
      id: 'b3',
      titleAr: 'جامع المفردات',
      descriptionAr: 'احفظ 5 كلمات في بنك الكلمات',
      icon: 'vocabulary',
      isUnlocked: totalSavedWords >= 5,
      progressText: `${Math.min(5, totalSavedWords)}/5 كلمات`,
    },
    {
      id: 'b4',
      titleAr: 'فارس الاختبارات',
      descriptionAr: 'أكمل اختبارين بنجاح',
      icon: 'target',
      isUnlocked: quizzesTaken >= 2,
      progressText: `${Math.min(2, quizzesTaken)}/2 اختبار`,
    },
    {
      id: 'b5',
      titleAr: 'خبير المقاهي',
      descriptionAr: 'أتقن درس طلب القهوة',
      icon: 'coffee',
      isUnlocked: userProfile.completedLessonIds.includes('lesson-cafe-01'),
      progressText: userProfile.completedLessonIds.includes('lesson-cafe-01') ? 'تم الإنجاز' : 'قيد التعلم',
    },
    {
      id: 'b6',
      titleAr: 'متحدث طليق',
      descriptionAr: 'اجمع 500 نقطة خبرة XP',
      icon: 'crown',
      isUnlocked: userProfile.xp >= 500,
      progressText: `${Math.min(500, userProfile.xp)}/500 XP`,
    },
    {
      id: 'b7',
      titleAr: 'رحلة الخمسين',
      descriptionAr: 'أكمل جميع دروس المسار التعليمي',
      icon: 'award',
      isUnlocked: path.completedCount >= lessons.length,
      progressText: `${path.completedCount}/${lessons.length} درسًا`,
    },
  ];

  return (
    <div className="w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5">
      {/* User Rank Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PremiumIcon name="trophy" size={56} />
            <div>
              <span className="text-[11px] font-bold text-sky-400 tracking-wider">
                رتبة التعلّم الحالية
              </span>
              <h2 className="text-lg font-black text-white">{rank.titleAr}</h2>
              <p dir="ltr" className="text-xs text-slate-400 font-en text-left">
                {rank.titleEn}
              </p>
            </div>
          </div>

          {/* Daily Streak Indicator */}
          <div className="flex flex-col items-center bg-slate-950/80 border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1 text-amber-400">
              <Flame className="w-5 h-5 fill-current animate-bounce" />
              <span className="text-lg font-black font-mono-num">{userProfile.streakDays}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">أيام تعلّم</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>النقاط الكلية: <strong className="text-amber-400 font-mono-num font-black">{userProfile.xp} XP</strong></span>
            </span>
            <span className="text-slate-400 font-mono-num text-[11px]">
              الهدف القادم: {rank.nextThreshold} XP
            </span>
          </div>

          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(10, rank.progressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">فيديوهات شاهدتها</span>
            <PlayCircle className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono-num">
            {Math.min(totalWatched, totalLessons)} <span className="text-xs font-normal text-slate-400">/ {totalLessons}</span>
          </span>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
            <div
              className="bg-sky-400 h-full"
              style={{ width: `${(totalWatched / totalLessons) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">مفردات متقنة</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono-num">
            {totalMasteredWords} <span className="text-xs font-normal text-slate-400">كلمة</span>
          </span>
          <span className="text-[10px] text-slate-500">
            من إجمالي {totalSavedWords} كلمة محفوظة
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">اختبارات منجزة</span>
            <CheckCircle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono-num">
            {quizzesTaken} <span className="text-xs font-normal text-slate-400">اختبار</span>
          </span>
          <span className="text-[10px] text-slate-500">
            {userProfile.completedLessonIds.length} دروس مكتملة
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">معدل التعلم اليومي</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-black text-rose-400 font-mono-num">
            {dailyLessons} <span className="text-xs font-normal text-slate-400">/ {userProfile.dailyGoalLessons} درس</span>
          </span>
          <span className="text-[10px] text-slate-500">إنجازات اليوم تُحسب مرة واحدة لكل درس</span>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white">هدفك اليومي</h3>
            <p className="mt-1 text-xs text-slate-400">اختر عدد الدروس الذي يناسب وقتك، ويمكنك تغييره متى شئت.</p>
          </div>
          <div className="flex gap-1.5" role="group" aria-label="تعديل هدف الدروس اليومي">
            {[1, 2, 3, 4].map((goal) => (
              <button
                key={goal}
                type="button"
                aria-pressed={userProfile.dailyGoalLessons === goal}
                onClick={() => onUpdateProfile({ dailyGoalLessons: goal })}
                className={`h-9 w-9 rounded-xl text-sm font-bold ${userProfile.dailyGoalLessons === goal ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-sky-400" style={{ width: `${Math.min(100, (dailyLessons / userProfile.dailyGoalLessons) * 100)}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{dailyLessons >= userProfile.dailyGoalLessons ? 'أحسنت، أنجزت هدف اليوم.' : `بقي ${Math.max(0, userProfile.dailyGoalLessons - dailyLessons)} درس لإكمال هدف اليوم.`}</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white">خريطة المراحل والاختبارات</h3>
            <p className="mt-1 text-xs text-slate-400">المرحلة التالية تفتح بعد إكمال الدروس واجتياز اختبارها.</p>
          </div>
          <span className="text-[10px] font-bold text-amber-300">محاولات الاختبارات: {examAttempts}</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {path.levels.map((level) => (
            <div key={level.stage} className={`rounded-2xl border p-3 ${level.isUnlocked ? 'border-slate-700 bg-slate-950/60' : 'border-slate-800 bg-slate-950/30 opacity-65'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">المرحلة {level.stage}</span>
                {level.examPassed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : !level.isUnlocked ? <Lock className="h-4 w-4 text-slate-500" /> : null}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-300">{level.titleAr}</p>
              <p className="mt-2 text-[10px] text-slate-400">{level.completedCount} من {level.lessons.length} درسًا</p>
              {level.examResult && <p className="mt-1 text-[10px] text-amber-300">أفضل اختبار: {level.examResult.bestScore}% · {level.examResult.attempts} محاولة</p>}
            </div>
          ))}
        </div>
        {(reviewTopics.length > 0 || reviewWords.length > 0) && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
            {reviewTopics.length > 0 && (
              <>
                <h4 className="text-xs font-bold text-amber-200">موضوعات راجعها من محاولاتك الأخيرة</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reviewTopics.slice(0, 8).map((topic) => <span key={topic} className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">{topic}</span>)}
                </div>
              </>
            )}
            {reviewWords.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-bold text-rose-200">مفردات أُضيفت تلقائيًا لقائمة المراجعة</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reviewWords.slice(0, 10).map((word) => <span key={word.id} dir="ltr" className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-200">{word.word} <span dir="rtl" className="text-slate-400">— {word.translationAr}</span></span>)}
                </div>
              </div>
            )}
            <p className="mt-2 text-[10px] text-slate-500">راجعها من تبويب «الكلمات ← للمراجعة»، وأزلها من القائمة عندما تتقنها.</p>
          </div>
        )}
      </section>

      {/* Achievement Badges Showcase */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300">أوسمة الإنجاز والتميز</h3>
          <span className="text-[11px] text-slate-500 font-mono-num">
            {badges.filter((b) => b.isUnlocked).length} من {badges.length} أوسمة
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => {
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  badge.isUnlocked
                    ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
              <PremiumIcon
                name={badge.icon}
                size={44}
                className={badge.isUnlocked ? '' : 'grayscale opacity-50'}
              />

                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate">
                    {badge.titleAr}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {badge.descriptionAr}
                  </p>
                  <span className="text-[9px] font-mono-num text-amber-400/90 font-bold block mt-0.5">
                    {badge.progressText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button to resume learning */}
      <div className="pt-2">
        <button
          onClick={onResumeLearning}
          className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-sky-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span>العودة لمشاهدة الفيديوهات ومواصلة التعلم</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};
