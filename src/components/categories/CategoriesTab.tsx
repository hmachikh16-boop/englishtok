import React, { useState } from 'react';
import { Search, Sparkles, Play, BookOpen, Clock, Heart, Lock, CheckCircle2, Trophy } from 'lucide-react';
import { Lesson, CategoryKey, UserProfile } from '../../types';
import { CATEGORIES } from '../../data/lessons';
import { CURRICULUM_CONFIG } from '../../data/curriculum';
import { speechService } from '../../services/speechService';
import { getLearningPathState } from '../../services/learningPath';
import { LevelFinalExam } from '../quiz/LevelFinalExam';
import { PremiumIcon } from '../icons/PremiumIcon';

interface CategoriesTabProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSelectLesson: (lessonId: string) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onSelectLesson,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [examStage, setExamStage] = useState<number | null>(null);
  const path = getLearningPathState(lessons, userProfile);

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
    <div className="w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5">
      <section className="rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/70 p-4 shadow-xl sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-sky-300">مسار EnglishTok التعليمي</p>
            <h2 className="mt-1 text-xl font-black text-white">تعلّم خطوة بخطوة</h2>
            <p className="mt-1 text-xs text-slate-400">50 درسًا في خمس مراحل، بمشاهد كرتونية متحركة من رسومات التطبيق (وليست مقاطع فيديو حقيقية).</p>
          </div>
          <div className="flex items-center gap-3">
            <PremiumIcon name="lesson" size={48} className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={() => onSelectLesson(path.nextLessonId)}
              className="flex items-center gap-2 rounded-xl bg-sky-400 px-3 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-sky-500/15"
            >
              <Play className="h-4 w-4 fill-current" />
              متابعة التعلم
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[11px] text-slate-300">
            <span>التقدم الكلي</span>
            <span>{path.completedCount} من {path.totalLessons} درسًا</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-sky-400" style={{ width: `${path.totalLessons ? (path.completedCount / path.totalLessons) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {path.levels.map((level) => {
            const levelLocked = !level.isUnlocked;
            return (
              <div key={level.stage} className={`rounded-2xl border p-3 ${levelLocked ? 'border-slate-800 bg-slate-950/50 opacity-70' : 'border-slate-700 bg-slate-950/70'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">المرحلة {level.stage} · {level.titleAr}</span>
                  {levelLocked ? <Lock className="h-4 w-4 text-slate-500" /> : level.examPassed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <span className="text-[10px] text-sky-300">{level.completedCount}/{level.lessons.length}</span>}
                </div>
                <p className="mt-1 min-h-8 text-[10px] leading-relaxed text-slate-400">{level.subtitleAr}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${level.lessons.length ? (level.completedCount / level.lessons.length) * 100 : 0}%` }} />
                </div>
                <button
                  type="button"
                  disabled={!level.canTakeExam}
                  onClick={() => setExamStage(level.stage)}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/5 py-1.5 text-[10px] font-bold text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trophy className="h-3 w-3" />
                  {level.examPassed ? `الاختبار مجتاز · الأفضل ${level.examResult?.bestScore ?? 0}%` : level.canTakeExam ? `الاختبار النهائي · النجاح ${CURRICULUM_CONFIG.passingScorePercent}%` : `أكمل ${level.lessons.length - level.completedCount} درسًا لفتح الاختبار`}
                </button>
              </div>
            );
          })}
        </div>
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

        <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {(['all', 1, 2, 3, 4, 5] as (number | 'all')[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                speechService.playPop();
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedLevel === lvl
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl === 'all' ? 'جميع المراحل' : `المرحلة ${lvl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Lessons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
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
                <div className="flex items-center gap-3">
                  {/* Avatar badge */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {lesson.characterA.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        المرحلة {lesson.curriculumStage}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lesson.characterA.name} & {lesson.characterB.name}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
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
