import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Heart,
  Lock,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES } from '../../data/lessons';
import { CURRICULUM_LEVELS } from '../../data/curriculum';
import { speechService } from '../../services/speechService';
import type { Lesson } from '../../types';
import type { LearningPathState } from '../../services/learningPath';
import { PrimaryAvatar } from '../video/PrimaryCharacterArt';

interface LessonLibraryTabProps {
  lessons: Lesson[];
  learningPath: LearningPathState;
  onSelectLesson: (lessonId: string) => void;
  isPhoneFrameView: boolean;
}

/**
 * The dedicated lessons window (tab). The full library that used to live on the
 * home screen: search, category pills, stage tabs and tappable lesson cards.
 * Kept out of the home tab so the main interface stays a light, single window.
 */
export const LessonLibraryTab: React.FC<LessonLibraryTabProps> = ({
  lessons,
  learningPath,
  onSelectLesson,
  isPhoneFrameView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [libraryPageSize, setLibraryPageSize] = useState(24);

  useEffect(() => {
    setLibraryPageSize(24);
  }, [selectedCategory, selectedLevel, deferredSearchQuery]);

  const filteredLessons = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || lesson.curriculumStage === selectedLevel;
      const matchesSearch =
        query === '' ||
        lesson.title.toLowerCase().includes(query) ||
        lesson.titleAr.includes(query) ||
        lesson.descriptionAr.includes(query) ||
        lesson.vocabulary.some((v) => v.word.toLowerCase().includes(query) || v.translationAr.includes(query));

      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [deferredSearchQuery, lessons, selectedCategory, selectedLevel]);
  const visibleLibraryLessons = useMemo(
    () => filteredLessons.slice(0, libraryPageSize),
    [filteredLessons, libraryPageSize],
  );

  const handleCardClick = useCallback(
    (id: string) => {
      if (learningPath.lessonStatusById.get(id) === 'locked') return;
      speechService.playPop();
      onSelectLesson(id);
    },
    [learningPath.lessonStatusById, onSelectLesson],
  );

  return (
    <div
      className={`journey-library w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}
      dir="rtl"
    >
      <header className="lessons-tab-head">
        <span className="lessons-tab-medallion" aria-hidden="true">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="lessons-tab-title">مكتبة الدروس</h2>
          <p className="lessons-tab-hint">
            ابحث واكتشف الدروس حسب التصنيف والمرحلة · {lessons.length} درسًا
          </p>
        </div>
      </header>

      <section className="lesson-library lessons-window" dir="rtl">
        <div className="lesson-library-body">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن درس، كلمة، أو موقف يومي..."
              className="library-search w-full rounded-2xl py-3 pr-11 pl-4 transition-colors"
            />
            <Search className="library-search-icon absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="library-section-title">التصنيفات التعليمية</h3>
              <span className="library-section-count">{CATEGORIES.length} تصنيفات</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  speechService.playPop();
                }}
                className={`category-pill ${selectedCategory === 'all' ? 'is-active' : ''}`}
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
                    className={`category-pill flex items-center gap-1.5 ${isSelected ? 'is-active' : ''}`}
                  >
                    <CategoryIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{cat.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="library-section-title mb-2">المرحلة التعليمية</h3>
            <div className="library-level-tabs flex gap-1.5 overflow-x-auto no-scrollbar p-1">
              {(['all', ...CURRICULUM_LEVELS.map((level) => level.stage)] as (number | 'all')[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    speechService.playPop();
                  }}
                  aria-label={lvl === 'all' ? 'جميع المراحل' : `المرحلة ${lvl}`}
                  className={`library-level-tab ${selectedLevel === lvl ? 'is-active' : ''}`}
                >
                  {lvl === 'all' ? 'الكل' : lvl}
                </button>
              ))}
            </div>
          </div>

          <div className={`lesson-card-grid grid grid-cols-1 md:grid-cols-2 gap-3 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}>
            <div className="md:col-span-2 flex items-center justify-between gap-2 library-card-meta">
              <span>دروس المسار ({filteredLessons.length})</span>
              <span>تُفتح الدروس تباعًا بعد إكمال الدرس السابق</span>
            </div>

            {filteredLessons.length === 0 ? (
              <div className="library-empty md:col-span-2">
                <p>لم يتم العثور على دروس تطابق هذا البحث.</p>
              </div>
            ) : (
              visibleLibraryLessons.map((lesson) => {
                const status = learningPath.lessonStatusById.get(lesson.id);
                const locked = status === 'locked';
                const durationMinutes = Math.max(
                  1,
                  Math.ceil(lesson.dialogue.reduce((duration, line) => duration + line.durationSec, 0) / 60),
                );
                return (
                  <button
                    type="button"
                    key={lesson.id}
                    onClick={() => handleCardClick(lesson.id)}
                    disabled={locked}
                    className={`lesson-card ${locked ? 'is-locked' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="lesson-card-avatar">
                          {lesson.characterA.design
                            ? <PrimaryAvatar design={lesson.characterA.design} className="h-12 w-12" label={lesson.characterA.nameAr} />
                            : lesson.characterA.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="lesson-card-stage">المرحلة {lesson.curriculumStage}</span>
                            <span className="lesson-card-hosts">{lesson.characterA.nameAr} و{lesson.characterB.nameAr}</span>
                          </div>
                          <h4 className="lesson-card-title">{lesson.titleAr}</h4>
                          <p dir="ltr" className="lesson-card-title-en">{lesson.title}</p>
                        </div>
                      </div>
                      <div className={`lesson-card-play ${status === 'completed' ? 'is-done' : ''}`} aria-hidden="true">
                        {locked ? <Lock className="h-4 w-4" /> : status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                      </div>
                    </div>
                    <p className="lesson-card-description">{lesson.descriptionAr}</p>
                    <div className="lesson-card-footer">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{lesson.vocabulary.length} كلمات</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{durationMinutes} د</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{status === 'completed' ? 'مكتمل' : locked ? 'مقفل' : 'متاح الآن'}</span>
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-mono-num">
                        <Heart className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{lesson.likesCount}</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
            {filteredLessons.length > libraryPageSize && (
              <button
                type="button"
                onClick={() => setLibraryPageSize((size) => size + 24)}
                className="lesson-library-more md:col-span-2"
              >
                <span>عرض المزيد من الدروس</span>
                <span className="lesson-library-more-count">متبقي {filteredLessons.length - libraryPageSize}</span>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
