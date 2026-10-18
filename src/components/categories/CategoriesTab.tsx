import React, { useState } from 'react';
import { Search, Sparkles, Play, BookOpen, Clock, Heart, Lock, CheckCircle2, Trophy, Star, ArrowDown, Footprints } from 'lucide-react';
import { Lesson, CategoryKey, UserProfile } from '../../types';
import { CATEGORIES } from '../../data/lessons';
import { CURRICULUM_CONFIG, CURRICULUM_LEVELS } from '../../data/curriculum';
import { speechService } from '../../services/speechService';
import { getLearningPathState } from '../../services/learningPath';
import { LevelFinalExam } from '../quiz/LevelFinalExam';
import { PremiumIcon } from '../icons/PremiumIcon';
import { LearningBuddy } from '../learning/LearningBuddy';

const StageChest: React.FC<{ earned: boolean }> = ({ earned }) => (
  <svg viewBox="0 0 48 48" className={`path-chest-art ${earned ? 'is-earned' : ''}`} aria-hidden="true">
    <path d="M7 18h34v23H7z" fill="#f2a900" stroke="#c77b00" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M5 13h38v9H5z" fill="#ffd43b" stroke="#d28a00" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M11 7h26l5 6H6z" fill="#ffe66d" stroke="#d28a00" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M7 28h34M16 22v19m16-19v19" stroke="#d28a00" strokeWidth="2.5" />
    <rect x="21" y="27" width="6" height="8" rx="1" fill="#fff3a6" stroke="#b46a00" strokeWidth="2" />
    {earned && <path d="m17 3 3 3 7-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

interface CategoriesTabProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSelectLesson: (lessonId: string) => void;
  isPhoneFrameView: boolean;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onSelectLesson,
  isPhoneFrameView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [examStage, setExamStage] = useState<number | null>(null);
  const path = getLearningPathState(lessons, userProfile);
  const today = new Date().toISOString().slice(0, 10);
  const dailyLessonCount = userProfile.dailyProgress.date === today ? userProfile.dailyProgress.completedLessonIds.length : 0;
  const dailyGoal = Math.max(1, userProfile.dailyGoalLessons);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || lesson.curriculumStage === selectedLevel;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      lesson.title.toLowerCase().includes(query) ||
      lesson.titleAr.includes(query) ||
      lesson.descriptionAr.includes(query) ||
      lesson.vocabulary.some((v) => v.word.toLowerCase().includes(query) || v.translationAr.includes(query));

    return matchesCategory && matchesLevel && matchesSearch;
  });

  const handleCardClick = (id: string) => {
    if (path.lessonStatusById.get(id) === 'locked') return;
    speechService.playPop();
    onSelectLesson(id);
  };

  const saveLevelExamResult = (
    stage: number,
    score: number,
    reviewTopics: string[],
    reviewWordIds: string[]
  ) => {
    const key = String(stage);
    const previous = userProfile.levelExamResults[key];
    const passed = previous?.passed === true || score >= CURRICULUM_CONFIG.passingScorePercent;
    const result = {
      attempts: (previous?.attempts ?? 0) + 1,
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      latestScore: score,
      passed,
      reviewTopics,
      reviewWordIds,
      passedAt: previous?.passedAt ?? (passed ? new Date().toISOString() : undefined),
    };
    onUpdateProfile({
      levelExamResults: { ...userProfile.levelExamResults, [key]: result },
      reviewWordIds: [...new Set([...userProfile.reviewWordIds, ...reviewWordIds])],
      xp: userProfile.xp + (passed && !previous?.passed ? 100 : 0),
    });
  };

  return (
    <div className={`journey-home w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}>
      <section className="path-hero relative overflow-hidden rounded-[2rem] border border-teal-200/10 p-5 shadow-2xl sm:p-7" dir="rtl">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black text-teal-200"><span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_#bef264]" /> رحلتك في EnglishTok</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">كل يوم، خطوة أقرب للطلاقة</h2>
            <p className="mt-2 max-w-lg text-xs leading-6 text-slate-300">{path.levels.length} مراحل و{path.totalLessons} درسًا بمواقف واقعية. واصل من حيث توقفت واجمع XP مع كل إنجاز.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <LearningBuddy message="يلا نتعلم!" />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-slate-950"><Sparkles className="h-5 w-5" /></div>
            <div><div className="text-lg font-black text-white">{path.completedCount}<span className="text-slate-400">/{path.totalLessons}</span></div><div className="text-[10px] text-slate-300">درس مكتمل</div></div>
            <button type="button" onClick={() => onSelectLesson(path.nextLessonId)} className="mr-1 flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-lime-300/20 hover:bg-lime-200 active:scale-95"><Play className="h-4 w-4 fill-current" /> ابدأ الآن</button>
          </div>
        </div>
        <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-lime-300 via-teal-300 to-cyan-300 transition-[width] duration-700" style={{ width: `${path.totalLessons ? (path.completedCount / path.totalLessons) * 100 : 0}%` }} /></div>
        <div className="daily-goal-card relative mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <span className="daily-goal-icon"><Sparkles className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-[10px] font-black"><span>هدف اليوم</span><span>{dailyLessonCount}/{dailyGoal} دروس</span></div><div className="daily-goal-track mt-1.5 h-1.5 overflow-hidden rounded-full"><div className="daily-goal-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, (dailyLessonCount / dailyGoal) * 100)}%` }} /></div></div>
          {dailyLessonCount >= dailyGoal && <span className="daily-goal-done"><CheckCircle2 className="h-4 w-4" /> اكتمل</span>}
        </div>
        <div className="relative mt-6 flex flex-col gap-4">
          {path.levels.map((level) => {
            const locked = !level.isUnlocked;
            const color = [
              'from-lime-300 to-emerald-300', 'from-emerald-300 to-green-300',
              'from-green-300 to-lime-300', 'from-lime-300 to-teal-300',
              'from-teal-300 to-emerald-300',
            ][(level.stage - 1) % 5];
            const mapNodeCount = level.lessons.length + 1;
            const examNodeClass = level.examPassed ? 'is-complete' : level.canTakeExam ? 'is-current' : 'is-locked';
            return <div key={level.stage} data-stage={level.stage} className={`path-stage rounded-3xl border p-4 sm:p-5 ${locked ? 'is-stage-locked' : ''}`}>
              <div className="path-stage-heading flex flex-wrap items-center justify-between gap-2">
                <div><div className="flex items-center gap-2 text-sm font-black text-white"><span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-slate-950`}>{locked ? <Lock className="h-4 w-4" /> : level.stage}</span> المرحلة {level.stage} <span className="text-teal-100">· {level.titleAr}</span></div><p className="mt-1 text-[10px] text-slate-400">{level.subtitleAr}</p></div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-slate-300">{level.completedCount}/{level.lessons.length} درس</span>
              </div>
              <div className="path-nodes mt-4" aria-label={`دروس المرحلة ${level.stage}`}>
                <svg className="path-ribbon" viewBox={`0 0 100 ${mapNodeCount * 116}`} preserveAspectRatio="none" aria-hidden="true">
                  <path d={Array.from({ length: mapNodeCount }, (_, nodeIndex) => {
                    const shifts = [0, 7, 10, 7, 0, -7, -10, -7, 0, 7];
                    const x = 50 + shifts[nodeIndex % shifts.length];
                    const y = nodeIndex * 116 + 68;
                    if (nodeIndex === 0) return `M ${x} ${y}`;
                    const previousX = 50 + shifts[(nodeIndex - 1) % shifts.length];
                    const previousY = (nodeIndex - 1) * 116 + 68;
                    return `C ${previousX} ${previousY + 38}, ${x} ${y - 38}, ${x} ${y}`;
                  }).join(' ')} />
                </svg>
                {level.lessons.map((entry, index) => {
                  const { lesson, status } = entry;
                  const complete = status === 'completed';
                  const current = status === 'current';
                  const unavailable = status === 'locked';
                  const NodeIcon = CATEGORIES.find((category) => category.key === lesson.category)?.icon ?? BookOpen;
                  const bestScore = userProfile.quizScores[lesson.id] ?? 0;
                  const starCount = bestScore >= 90 ? 3 : bestScore >= 70 ? 2 : complete ? 1 : 0;
                  return <React.Fragment key={lesson.id}>
                    <button type="button" disabled={unavailable} onClick={() => onSelectLesson(lesson.id)} className={`path-node group ${complete ? 'is-complete' : current ? 'is-current' : unavailable ? 'is-locked' : 'is-open'}`} aria-label={`${lesson.titleAr}، ${complete ? 'مكتمل' : current ? 'الدرس الحالي' : unavailable ? 'مقفل' : 'متاح'}`}>
                      <span className="path-node-orb">{complete ? <CheckCircle2 className="path-node-icon path-star h-7 w-7" strokeWidth={3} /> : unavailable ? <Lock className="path-node-icon h-5 w-5" /> : current ? <Footprints className="path-node-icon h-7 w-7" strokeWidth={2.8} /> : <NodeIcon className="path-node-icon h-6 w-6" aria-hidden="true" />}<span className="path-node-number">{index + 1}</span></span>
                      <span className="path-node-title">{lesson.titleAr}</span>
                      {complete && <span className="path-node-stars" aria-label={`${starCount} نجوم`} dir="ltr">{[0, 1, 2].map((star) => <Star key={star} className={star < starCount ? 'earned' : ''} />)}</span>}
                      {current && <span className="path-node-hint"><Play className="h-3 w-3 fill-current" /> ابدأ هنا</span>}
                      {current && <span className="path-node-guide" aria-hidden="true"><LearningBuddy compact /></span>}
                    </button>
                  </React.Fragment>;
                })}
                <button
                  type="button"
                  disabled={!level.canTakeExam}
                  onClick={() => setExamStage(level.stage)}
                  className={`path-node path-exam-node ${examNodeClass}`}
                  aria-label={`اختبار المرحلة ${level.stage}${level.examPassed ? '، مكتمل' : level.canTakeExam ? '، متاح' : '، أكمل الدروس أولًا'}`}
                >
                  <span className="path-node-orb"><StageChest earned={level.examPassed} />{!level.canTakeExam && !level.examPassed && <Lock className="path-exam-lock" />}</span>
                  <span className="path-node-title">اختبار المرحلة</span>
                  {level.examPassed && <span className="path-node-hint exam-earned-hint"><CheckCircle2 className="h-3 w-3" /> اجتزت الاختبار</span>}
                  {level.canTakeExam && !level.examPassed && <span className="path-node-hint"><Play className="h-3 w-3 fill-current" /> اختبر نفسك</span>}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
                <div className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-gradient-to-l ${color}`} style={{ width: `${level.lessons.length ? (level.completedCount / level.lessons.length) * 100 : 0}%` }} /></div>
                <span className={`path-exam-summary ${level.examPassed ? 'is-earned' : ''}`}><Trophy className="h-3.5 w-3.5" />{level.examPassed ? `النتيجة ${level.examResult?.bestScore ?? 0}%` : `النجاح من ${CURRICULUM_CONFIG.passingScorePercent}%`}</span>
              </div>
            </div>;
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400"><ArrowDown className="h-3.5 w-3.5 text-lime-200" />أكمل الدروس بالترتيب لفتح محطات جديدة</div>
      </section>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن درس، كلمة، أو موقف يومي..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pr-11 pl-4 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors shadow-lg"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
      </div>

      {/* Categories Horizontal Carousel */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-300">التصنيفات التعليمية</h3>
          <span className="text-[11px] text-slate-500 font-mono-num">
            {CATEGORIES.length} تصنيفات
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => {
              setSelectedCategory('all');
              speechService.playPop();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 border ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            الكل
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const CategoryIcon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  speechService.playPop();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all active:scale-95 border ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CategoryIcon className="w-4 h-4" aria-hidden="true" />
                <span>{cat.nameAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Levels Filter Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-300">المرحلة التعليمية</h3>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-900 rounded-xl border border-slate-800">
          {(['all', ...CURRICULUM_LEVELS.map((level) => level.stage)] as (number | 'all')[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                speechService.playPop();
              }}
              aria-label={lvl === 'all' ? 'جميع المراحل' : `المرحلة ${lvl}`}
              className={`shrink-0 min-w-9 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedLevel === lvl
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl === 'all' ? 'الكل' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Lessons Cards Grid */}
        <div className={`lesson-card-grid grid grid-cols-1 md:grid-cols-2 gap-3 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}>
        <div className="md:col-span-2 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>دروس المسار ({filteredLessons.length})</span>
          <span className="text-[11px] text-slate-500">تُفتح الدروس تباعًا بعد إكمال الدرس السابق</span>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-xs text-slate-400">لم يتم العثور على دروس تطابق هذا البحث.</p>
          </div>
        ) : (
          filteredLessons.map((lesson) => {
            const durationMinutes = Math.max(1, Math.ceil(lesson.dialogue.reduce((duration, line) => duration + line.durationSec, 0) / 60));
            return (
            <button
              type="button"
              key={lesson.id}
              onClick={() => handleCardClick(lesson.id)}
              disabled={path.lessonStatusById.get(lesson.id) === 'locked'}
              className={`group flex flex-col gap-2.5 rounded-2xl border p-3.5 text-right shadow-lg transition-all active:scale-[0.99] ${path.lessonStatusById.get(lesson.id) === 'locked' ? 'cursor-not-allowed border-slate-800 bg-slate-950/60 opacity-60' : 'cursor-pointer border-slate-800 bg-slate-900 hover:border-slate-700'}`}
            >
              <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                  {/* Avatar badge */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {lesson.characterA.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        المرحلة {lesson.curriculumStage}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lesson.characterA.nameAr} و{lesson.characterB.nameAr}
                      </span>
                    </div>
                    <h4 className="break-words text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                      {lesson.titleAr}
                    </h4>
                    <p dir="ltr" className="text-xs text-slate-400 font-en text-left">
                      {lesson.title}
                    </p>
                  </div>
                </div>

                {/* Play button */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${path.lessonStatusById.get(lesson.id) === 'locked' ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-sky-500/30 bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950'}`}>
                  {path.lessonStatusById.get(lesson.id) === 'locked' ? <Lock className="h-4 w-4" /> : path.lessonStatusById.get(lesson.id) === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {lesson.descriptionAr}
              </p>

              {/* Lesson metadata footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lesson.vocabulary.length} كلمات</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{durationMinutes} د</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{path.lessonStatusById.get(lesson.id) === 'completed' ? 'مكتمل' : path.lessonStatusById.get(lesson.id) === 'locked' ? 'مقفل' : 'متاح الآن'}</span>
                  </span>
                </div>

                <span className="flex items-center gap-1 font-mono-num text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lesson.likesCount}</span>
                </span>
              </div>
            </button>
            );
          })
        )}
      </div>
      {examStage !== null && (() => {
        const level = path.levels.find((entry) => entry.stage === examStage);
        if (!level) return null;
        return (
          <LevelFinalExam
            key={examStage}
            stage={level.stage}
            titleAr={level.titleAr}
            lessons={level.lessons.map((entry) => entry.lesson)}
            result={userProfile.levelExamResults[String(level.stage)]}
            voiceAccent={userProfile.settings.voiceAccent}
            onClose={() => setExamStage(null)}
            onComplete={(score, topics, wordIds) => saveLevelExamResult(level.stage, score, topics, wordIds)}
          />
        );
      })()}
    </div>
  );
};
