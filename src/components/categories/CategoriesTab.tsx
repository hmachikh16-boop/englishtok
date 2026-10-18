import React, { useEffect, useRef, useState } from 'react';
import { Search, Sparkles, Play, BookOpen, Clock, Heart, Lock, CheckCircle2, Trophy, Star, ArrowDown, Footprints } from 'lucide-react';
import { Lesson, CategoryKey, UserProfile } from '../../types';
import { CATEGORIES } from '../../data/lessons';
import { CURRICULUM_CONFIG, CURRICULUM_LEVELS } from '../../data/curriculum';
import { speechService } from '../../services/speechService';
import { getLearningPathState } from '../../services/learningPath';
import { LevelFinalExam } from '../quiz/LevelFinalExam';
import { PremiumIcon } from '../icons/PremiumIcon';
import { LearningBuddy } from '../learning/LearningBuddy';
import { EDUCATIONAL_PHASES, findSchoolYearRoute, SCHOOL_YEAR_ALIGNMENT_NOTE } from '../../data/educationalStructure';

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
  const routeRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [examStage, setExamStage] = useState<number | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const path = getLearningPathState(lessons, userProfile);
  const selectedPhase = EDUCATIONAL_PHASES.find((phase) => phase.id === selectedPhaseId);
  const selectedSchoolYear = findSchoolYearRoute(selectedSchoolYearId);
  useEffect(() => {
    if (!selectedSchoolYearId) return;
    routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedSchoolYearId]);
  const primaryYearRoutes = EDUCATIONAL_PHASES.find((phase) => phase.id === 'primary')?.years ?? [];
  const completedLessonIds = new Set(userProfile.completedLessonIds);
  const getPrimaryYearProgress = (yearId: string) => {
    const yearLessons = lessons.filter((lesson) => lesson.schoolYearId === yearId);
    const completed = yearLessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
    const yearIndex = primaryYearRoutes.findIndex((year) => year.id === yearId);
    const priorYearsComplete = yearIndex <= 0 || primaryYearRoutes.slice(0, yearIndex).every((year) => {
      const priorLessons = lessons.filter((lesson) => lesson.schoolYearId === year.id);
      return priorLessons.length === 50 && priorLessons.every((lesson) => completedLessonIds.has(lesson.id));
    });
    return { yearLessons, completed, priorYearsComplete };
  };
  const getLessonStatus = (lesson: Lesson) => {
    if (!lesson.schoolYearId) return path.lessonStatusById.get(lesson.id);
    const { yearLessons, priorYearsComplete } = getPrimaryYearProgress(lesson.schoolYearId);
    if (completedLessonIds.has(lesson.id)) return 'completed';
    if (!priorYearsComplete) return 'locked';
    const lessonIndex = yearLessons.findIndex((entry) => entry.id === lesson.id);
    return yearLessons.slice(0, lessonIndex).every((entry) => completedLessonIds.has(entry.id)) ? 'current' : 'locked';
  };
  const visibleLevels = (() => {
    if (selectedSchoolYear?.grade) {
      const { yearLessons, completed, priorYearsComplete } = getPrimaryYearProgress(selectedSchoolYear.id);
      const baseLevel = path.levels.find((level) => level.stage === selectedSchoolYear.grade);
      if (!baseLevel) return [];
      let foundCurrent = false;
      const entries = yearLessons.map((lesson) => {
        const isComplete = completedLessonIds.has(lesson.id);
        const status = isComplete ? 'completed' as const
          : !priorYearsComplete || foundCurrent ? 'locked' as const
            : (foundCurrent = true, 'current' as const);
        return { lesson, status };
      });
      return [{
        ...baseLevel,
        titleAr: selectedSchoolYear.labelAr,
        subtitleAr: `${yearLessons.length} درسًا بتدرّج مناسب لهذه السنة`,
        lessons: entries,
        completedCount: completed,
        isUnlocked: priorYearsComplete,
        canTakeExam: false,
        examPassed: false,
      }];
    }
    return selectedSchoolYear
      ? path.levels.filter((level) => selectedSchoolYear.stages.includes(level.stage))
      : path.levels;
  })();
  const isPrimarySchoolYear = Boolean(selectedSchoolYear?.grade);
  const today = new Date().toISOString().slice(0, 10);
  const dailyLessonCount = userProfile.dailyProgress.date === today ? userProfile.dailyProgress.completedLessonIds.length : 0;
  const dailyGoal = Math.max(1, userProfile.dailyGoalLessons);
  const nextLessonId = selectedSchoolYear?.grade
    ? (() => {
        const { yearLessons, priorYearsComplete } = getPrimaryYearProgress(selectedSchoolYear.id);
        return priorYearsComplete
          ? yearLessons.find((lesson) => !completedLessonIds.has(lesson.id))?.id ?? path.nextLessonId
          : path.nextLessonId;
      })()
    : path.nextLessonId;
  const routeRows = visibleLevels.flatMap((level) => [
    { type: 'unit' as const, level },
    ...level.lessons.map((entry, index) => ({ type: 'lesson' as const, level, entry, index })),
    ...(!isPrimarySchoolYear ? [{ type: 'exam' as const, level }] : []),
  ]);
  let routeCursor = 0;
  const routeNodes = routeRows.flatMap((row) => {
    if (row.type === 'unit') {
      routeCursor += 82;
      return [];
    }
    const positioned = { row, y: routeCursor + 56 };
    routeCursor += 112;
    return [positioned];
  });
  const routeHeight = visibleLevels.reduce((height, level) => height + 82 + (level.lessons.length + (isPrimarySchoolYear ? 0 : 1)) * 112, 0);
  const routeShifts = [0, 30, 44, 30, 0, -30, -44, -30, 0, 30];
  const routePath = routeNodes.map((node, nodeIndex) => {
    const x = 50 + (routeShifts[nodeIndex % routeShifts.length] * 100) / 470;
    const y = node.y;
    if (nodeIndex === 0) return `M ${x} ${y}`;
    const previousIndex = nodeIndex - 1;
    const previousX = 50 + (routeShifts[previousIndex % routeShifts.length] * 100) / 470;
    const previousY = routeNodes[previousIndex].y;
    return `C ${previousX} ${previousY + 38}, ${x} ${y - 38}, ${x} ${y}`;
  }).join(' ');

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
    const lesson = lessons.find((entry) => entry.id === id);
    if (lesson && getLessonStatus(lesson) === 'locked') return;
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
        <div className="path-hero-intro relative flex flex-wrap items-center justify-between gap-4">
          <div className="path-hero-copy">
            <p className="flex items-center gap-2 text-xs font-black text-teal-200"><span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_#bef264]" /> رحلتك في EnglishTok</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">كل يوم، خطوة أقرب للطلاقة</h2>
            <p className="mt-2 max-w-lg text-xs leading-6 text-slate-300">{path.levels.length} مراحل و{path.totalLessons} درسًا في المسار العام، إضافة إلى 250 درسًا متدرجًا للسنوات الابتدائية الخمس.</p>
          </div>
          <div className="path-hero-summary flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <LearningBuddy message="يلا نتعلم!" />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-slate-950"><Sparkles className="h-5 w-5" /></div>
            <div><div className="text-lg font-black text-white">{path.completedCount}<span className="text-slate-400">/{path.totalLessons}</span></div><div className="text-[10px] text-slate-300">درس مكتمل</div></div>
            <button type="button" onClick={() => handleCardClick(nextLessonId)} className="path-start-button mr-1 flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-lime-300/20 hover:bg-lime-200 active:scale-95"><Play className="h-4 w-4 fill-current" /> ابدأ الآن</button>
          </div>
        </div>
        <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-lime-300 via-teal-300 to-cyan-300 transition-[width] duration-700" style={{ width: `${path.totalLessons ? (path.completedCount / path.totalLessons) * 100 : 0}%` }} /></div>
        <div className="daily-goal-card relative mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <span className="daily-goal-icon"><Sparkles className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-[10px] font-black"><span>هدف اليوم</span><span>{dailyLessonCount}/{dailyGoal} دروس</span></div><div className="daily-goal-track mt-1.5 h-1.5 overflow-hidden rounded-full"><div className="daily-goal-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, (dailyLessonCount / dailyGoal) * 100)}%` }} /></div></div>
          {dailyLessonCount >= dailyGoal && <span className="daily-goal-done"><CheckCircle2 className="h-4 w-4" /> اكتمل</span>}
        </div>
        <section className="school-phase-explorer mt-5" aria-labelledby="school-phase-title">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div><h3 id="school-phase-title" className="text-sm font-black text-slate-800">التعلّم حسب الطور الدراسي</h3><p className="mt-1 text-[10px] leading-5 text-slate-500">اختر طورًا وسنة لعرض وحدات المحتوى المرتبطة بها.</p></div>
            {selectedPhase && <button type="button" onClick={() => { setSelectedPhaseId(null); setSelectedSchoolYearId(null); }} className="school-phase-back">كل الأطوار</button>}
          </div>
          {!selectedPhase ? (
            <div className="school-phase-grid">
              {EDUCATIONAL_PHASES.map((phase) => {
                const PhaseIcon = phase.icon;
                return <button key={phase.id} type="button" onClick={() => { setSelectedPhaseId(phase.id); setSelectedSchoolYearId(null); }} className="school-phase-card">
                  <span className="school-phase-icon"><PhaseIcon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><strong>{phase.titleAr}</strong><small>{phase.subtitleAr}</small></span>
                  <span className="school-phase-count">{phase.years.length} {phase.years.length === 1 ? 'مسار' : 'سنوات'}</span>
                </button>;
              })}
            </div>
          ) : (
            <div className="school-year-list" aria-label="اسحب لاختيار السنة الدراسية">
              <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-800"><selectedPhase.icon className="h-4 w-4" />{selectedPhase.titleAr}</div>
              <div className="school-year-options">
                {selectedPhase.years.map((year) => {
                  const yearIsSelected = selectedSchoolYearId === year.id;
                  const primaryProgress = year.grade ? getPrimaryYearProgress(year.id) : null;
                  const unlocked = primaryProgress?.priorYearsComplete ?? year.stages.some((stage) => path.levels.find((level) => level.stage === stage)?.isUnlocked);
                  const progressLabel = primaryProgress
                    ? `${primaryProgress.completed}/${primaryProgress.yearLessons.length} درسًا · ${unlocked ? 'متاح' : 'أكمل السنة السابقة أولًا'}`
                    : unlocked ? 'متاح للمراجعة والتعلّم' : 'يُفتح بعد التقدم في المسار';
                  return <button key={year.id} type="button" disabled={!unlocked} onClick={() => setSelectedSchoolYearId(year.id)} className={`school-year-option ${yearIsSelected ? 'is-selected' : ''}`}>
                    <span>{year.labelAr}</span><small>{progressLabel}</small>
                  </button>;
                })}
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">{SCHOOL_YEAR_ALIGNMENT_NOTE}</p>
            </div>
          )}
        </section>
        {selectedSchoolYear && <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800"><span>{selectedSchoolYear.labelAr}</span><button type="button" onClick={() => setSelectedSchoolYearId(null)} className="underline">عرض المسار كاملًا</button></div>}
        <div ref={routeRef} className="continuous-route relative mt-6" aria-label="مسار التعلم الكامل">
          <svg className="continuous-route-ribbon" viewBox={`0 0 100 ${routeHeight}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={routePath} />
          </svg>
          {visibleLevels.map((level) => {
            const locked = !level.isUnlocked;
            const color = [
              'from-lime-300 to-emerald-300', 'from-emerald-300 to-green-300',
              'from-green-300 to-lime-300', 'from-lime-300 to-teal-300',
              'from-teal-300 to-emerald-300',
            ][(level.stage - 1) % 5];
            const examNodeClass = level.examPassed ? 'is-complete' : level.canTakeExam ? 'is-current' : 'is-locked';
            return <div key={level.stage} data-stage={level.stage} className={`path-stage continuous-route-unit ${locked ? 'is-stage-locked' : ''}`}>
              <div className="path-stage-heading flex flex-wrap items-center justify-between gap-2">
                <div><div className="flex items-center gap-2 text-sm font-black text-white"><span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-slate-950`}>{locked ? <Lock className="h-4 w-4" /> : level.stage}</span>{isPrimarySchoolYear ? level.titleAr : <>المرحلة {level.stage} <span className="text-teal-100">· {level.titleAr}</span></>}</div><p className="mt-1 text-[10px] text-slate-400">{level.subtitleAr}</p></div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-slate-300">{level.completedCount}/{level.lessons.length} درس</span>
              </div>
              <div className="path-nodes continuous-route-nodes" aria-label={`دروس المرحلة ${level.stage}`}>
                {level.lessons.map((entry, index) => {
                  const { lesson, status } = entry;
                  const complete = status === 'completed';
                  const current = status === 'current';
                  const unavailable = status === 'locked';
                  const NodeIcon = CATEGORIES.find((category) => category.key === lesson.category)?.icon ?? BookOpen;
                  const bestScore = userProfile.quizScores[lesson.id] ?? 0;
                  const starCount = bestScore >= 90 ? 3 : bestScore >= 70 ? 2 : complete ? 1 : 0;
                  return <React.Fragment key={lesson.id}>
                    <button type="button" disabled={unavailable} onClick={() => handleCardClick(lesson.id)} style={{ transform: `translateX(${(routeShifts[routeNodes.findIndex((node) => node.row.type === 'lesson' && node.row.entry.lesson.id === lesson.id) % routeShifts.length] / 470) * 100}%)` }} className={`path-node group ${complete ? 'is-complete' : current ? 'is-current' : unavailable ? 'is-locked' : 'is-open'}`} aria-label={`${lesson.titleAr}، ${complete ? 'مكتمل' : current ? 'الدرس الحالي' : unavailable ? 'مقفل' : 'متاح'}`}>
                      <span className="path-node-orb">{complete ? <CheckCircle2 className="path-node-icon path-star h-7 w-7" strokeWidth={3} /> : unavailable ? <Lock className="path-node-icon h-5 w-5" /> : current ? <Footprints className="path-node-icon h-7 w-7" strokeWidth={2.8} /> : <NodeIcon className="path-node-icon h-6 w-6" aria-hidden="true" />}<span className="path-node-number">{index + 1}</span></span>
                      <span className="path-node-title">{lesson.titleAr}</span>
                      {complete && <span className="path-node-stars" aria-label={`${starCount} نجوم`} dir="ltr">{[0, 1, 2].map((star) => <Star key={star} className={star < starCount ? 'earned' : ''} />)}</span>}
                      {current && <span className="path-node-hint"><Play className="h-3 w-3 fill-current" /> ابدأ هنا</span>}
                      {current && <span className="path-node-guide" aria-hidden="true"><LearningBuddy compact /></span>}
                    </button>
                  </React.Fragment>;
                })}
                {!isPrimarySchoolYear && <button
                  type="button"
                  disabled={!level.canTakeExam}
                  onClick={() => setExamStage(level.stage)}
                  style={{ transform: `translateX(${(routeShifts[routeNodes.findIndex((node) => node.row.type === 'exam' && node.row.level.stage === level.stage) % routeShifts.length] / 470) * 100}%)` }}
                  className={`path-node path-exam-node ${examNodeClass}`}
                  aria-label={`اختبار المرحلة ${level.stage}${level.examPassed ? '، مكتمل' : level.canTakeExam ? '، متاح' : '، أكمل الدروس أولًا'}`}
                >
                  <span className="path-node-orb"><StageChest earned={level.examPassed} />{!level.canTakeExam && !level.examPassed && <Lock className="path-exam-lock" />}</span>
                  <span className="path-node-title">اختبار المرحلة</span>
                  {level.examPassed && <span className="path-node-hint exam-earned-hint"><CheckCircle2 className="h-3 w-3" /> اجتزت الاختبار</span>}
                  {level.canTakeExam && !level.examPassed && <span className="path-node-hint"><Play className="h-3 w-3 fill-current" /> اختبر نفسك</span>}
                </button>}
              </div>
              <div className="continuous-unit-progress"><span className="continuous-unit-progress-fill" style={{ width: `${level.lessons.length ? (level.completedCount / level.lessons.length) * 100 : 0}%` }} /></div>
            </div>;
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400"><ArrowDown className="h-3.5 w-3.5 text-lime-200" />أكمل الدروس بالترتيب لفتح محطات جديدة</div>
      </section>

      <details className="lesson-library" dir="rtl">
        <summary>
          <span>استعراض جميع الدروس</span>
          <span className="lesson-library-count">{lessons.length} درسًا</span>
          <ArrowDown className="lesson-library-chevron" aria-hidden="true" />
        </summary>

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
      </details>
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
