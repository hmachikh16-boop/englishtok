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
  type LucideIcon,
} from 'lucide-react';
import { UserProfile, Lesson } from '../../types';
import { getUserRank } from '../../services/storageService';

interface ProgressTabProps {
  userProfile: UserProfile;
  lessons: Lesson[];
  onResumeLearning: () => void;
}

interface Badge {
  id: string;
  titleAr: string;
  descriptionAr: string;
  icon: LucideIcon;
  isUnlocked: boolean;
  progressText: string;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  userProfile,
  lessons,
  onResumeLearning,
}) => {
  const rank = getUserRank(userProfile.xp);

  // Compute stats
  const totalWatched = userProfile.watchedLessonIds.length;
  const totalLessons = lessons.length;
  const totalSavedWords = userProfile.savedWordIds.length;
  const totalMasteredWords = userProfile.masteredWordIds.length;
  const quizzesTaken = Object.keys(userProfile.quizScores).length;

  // Achievement Badges
  const badges: Badge[] = [
    {
      id: 'b1',
      titleAr: 'أولى الخطوات',
      descriptionAr: 'شاهد أول فيديو تعليمي',
      icon: PlayCircle,
      isUnlocked: totalWatched >= 1,
      progressText: `${Math.min(1, totalWatched)}/1`,
    },
    {
      id: 'b2',
      titleAr: 'شعلة الاستمرار',
      descriptionAr: 'حقق سلسلة تعلم 3 أيام متتالية',
      icon: Flame,
      isUnlocked: userProfile.streakDays >= 3,
      progressText: `${Math.min(3, userProfile.streakDays)}/3 أيام`,
    },
    {
      id: 'b3',
      titleAr: 'جامع المفردات',
      descriptionAr: 'احفظ 5 كلمات في بنك الكلمات',
      icon: BookOpen,
      isUnlocked: totalSavedWords >= 5,
      progressText: `${Math.min(5, totalSavedWords)}/5 كلمات`,
    },
    {
      id: 'b4',
      titleAr: 'فارس الاختبارات',
      descriptionAr: 'أكمل اختبارين بنجاح',
      icon: Target,
      isUnlocked: quizzesTaken >= 2,
      progressText: `${Math.min(2, quizzesTaken)}/2 اختبار`,
    },
    {
      id: 'b5',
      titleAr: 'خبير المقاهي',
      descriptionAr: 'أتقن درس طلب القهوة',
      icon: Coffee,
      isUnlocked: userProfile.completedLessonIds.includes('lesson-cafe-01'),
      progressText: userProfile.completedLessonIds.includes('lesson-cafe-01') ? 'تم الإنجاز' : 'قيد التعلم',
    },
    {
      id: 'b6',
      titleAr: 'متحدث طليق',
      descriptionAr: 'اجمع 500 نقطة خبرة XP',
      icon: Crown,
      isUnlocked: userProfile.xp >= 500,
      progressText: `${Math.min(500, userProfile.xp)}/500 XP`,
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20">
              <Trophy className="w-7 h-7" />
            </div>
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
            <span className="text-[10px] text-slate-400 font-medium">أيام متتالية</span>
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
            {totalWatched} <span className="text-xs font-normal text-slate-400">/ {totalLessons}</span>
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
            +45 <span className="text-xs font-normal text-slate-400">XP / يوم</span>
          </span>
          <span className="text-[10px] text-slate-500">استمر لتحافظ على الشعلة!</span>
        </div>
      </div>

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
            const BadgeIcon = badge.icon;

            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  badge.isUnlocked
                    ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  badge.isUnlocked
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-800 text-slate-600 grayscale'
                }`}
              >
                <BadgeIcon className="w-5 h-5" />
              </div>

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
