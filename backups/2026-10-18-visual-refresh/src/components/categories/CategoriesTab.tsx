import React, { useState } from 'react';
import { Search, Sparkles, Play, BookOpen, Clock, Heart } from 'lucide-react';
import { Lesson, CategoryKey, Level } from '../../types';
import { CATEGORIES } from '../../data/lessons';
import { speechService } from '../../services/speechService';

interface CategoriesTabProps {
  lessons: Lesson[];
  onSelectLesson: (lessonId: string) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  lessons,
  onSelectLesson,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = lessons.filter((lesson) => {
    const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || lesson.level === selectedLevel;
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
    speechService.playPop();
    onSelectLesson(id);
  };

  return (
    <div className="w-full h-full max-w-xl mx-auto overflow-y-auto no-scrollbar pb-24 p-4 text-slate-100 flex flex-col gap-5">
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
                <span>{cat.icon}</span>
                <span>{cat.nameAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Levels Filter Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-300">مستوى الصعوبة</h3>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {(['all', 'A1', 'A2', 'B1', 'B2'] as (Level | 'all')[]).map((lvl) => (
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
              {lvl === 'all' ? 'جميع المستويات' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Lessons Cards Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>الدروس المتاحة ({filteredLessons.length})</span>
          <span className="text-[11px] text-slate-500">انقر على أي درس لبدء المشاهدة</span>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-xs text-slate-400">لم يتم العثور على دروس تطابق هذا البحث.</p>
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => handleCardClick(lesson.id)}
              className="group bg-slate-900 border border-slate-800 rounded-2xl p-3.5 hover:border-slate-700 transition-all cursor-pointer shadow-lg active:scale-[0.99] flex flex-col gap-2.5"
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
                        {lesson.level}
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
                <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
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
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>اختبار متاح</span>
                  </span>
                </div>

                <span className="flex items-center gap-1 font-mono-num text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lesson.likesCount}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
