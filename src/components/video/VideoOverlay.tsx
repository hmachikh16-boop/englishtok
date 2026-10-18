import React, { useEffect, useRef, useState } from 'react';
import { 
  Heart, 
  Bookmark, 
  BookOpen, 
  RotateCcw, 
  Volume2, 
  Languages, 
  Share2, 
  Sparkles,
  VolumeX,
  Lightbulb,
  Play,
  Pause,
} from 'lucide-react';
import { Lesson, DialogueLine, VocabularyWord } from '../../types';

interface VideoOverlayProps {
  lesson: Lesson;
  currentLine: DialogueLine | null;
  lineIndex: number;
  totalLines: number;
  isPlaying: boolean;
  isLiked: boolean;
  isFavorited: boolean;
  playbackSpeed: number;
  subtitlesMode: 'both' | 'en' | 'ar' | 'none';
  onTogglePlay: () => void;
  onToggleLike: () => void;
  onToggleFavorite: () => void;
  onCycleSpeed: () => void;
  onCycleSubtitles: () => void;
  onReplayCurrentLine: () => void;
  onStopSpeaking: () => void;
  onOpenVocabDrawer: () => void;
  onOpenQuiz: () => void;
  onWordClick?: (word: string) => void;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  lesson,
  currentLine,
  lineIndex,
  totalLines,
  isPlaying,
  onTogglePlay,
  isLiked,
  isFavorited,
  playbackSpeed,
  subtitlesMode,
  onToggleLike,
  onToggleFavorite,
  onCycleSpeed,
  onCycleSubtitles,
  onReplayCurrentLine,
  onStopSpeaking,
  onOpenVocabDrawer,
  onOpenQuiz,
  onWordClick,
}) => {
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedWordTooltip, setSelectedWordTooltip] = useState<string | null>(null);
  const [showLearningNote, setShowLearningNote] = useState(false);
  const copiedToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordTooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedToastTimeout.current) clearTimeout(copiedToastTimeout.current);
    if (wordTooltipTimeout.current) clearTimeout(wordTooltipTimeout.current);
  }, []);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.clipboard) {
      console.error('Clipboard sharing is not supported in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `شاهد هذا الدرس الممتع لتعليم الإنجليزية على EnglishTok: "${lesson.titleAr} - ${lesson.title}"\n${window.location.href}`
      );
      setCopiedToast(true);
      if (copiedToastTimeout.current) clearTimeout(copiedToastTimeout.current);
      copiedToastTimeout.current = setTimeout(() => setCopiedToast(false), 2400);
    } catch (error) {
      console.error('Unable to copy the lesson link:', error);
    }
  };

  const handleWordTap = (e: React.MouseEvent, rawWord: string) => {
    e.stopPropagation();
    const clean = rawWord.replace(/[^a-zA-Z]/g, '');
    if (!clean) return;

    // Check if word exists in lesson vocabulary
    const matchedVocab = lesson.vocabulary.find(
      (v) => v.word.toLowerCase().includes(clean.toLowerCase())
    );

    setSelectedWordTooltip(
      matchedVocab 
        ? `${clean} = ${matchedVocab.translationAr}` 
        : `${clean} (انقر للاستماع)`
    );

    if (onWordClick) {
      onWordClick(clean);
    }

    if (wordTooltipTimeout.current) clearTimeout(wordTooltipTimeout.current);
    wordTooltipTimeout.current = setTimeout(() => {
      setSelectedWordTooltip(null);
    }, 3000);
  };

  return (
    <div
      dir="ltr"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 sm:p-4"
    >
      {/* Top Scrim and Category Info */}
      <div className="pointer-events-auto flex w-full items-center justify-between gap-2 pr-12 pt-1">
        <div
          dir="rtl"
          className="flex min-w-0 max-w-[58%] items-center gap-2 overflow-hidden rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-1.5 shadow-lg backdrop-blur-md"
        >
          <span className="text-amber-400 text-xs font-bold">
            المرحلة {lesson.curriculumStage}
          </span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="truncate text-xs font-semibold text-slate-200">
            {lesson.titleAr}
          </span>
        </div>

        {/* Quick Quiz button at top */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenQuiz();
          }}
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 sm:text-xs"
          aria-label="اختبر نفسك"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>اختبر نفسك (+15 XP)</span>
        </button>
      </div>

      {/* Share Toast Feedback */}
      {copiedToast && (
        <div dir="rtl" className="pointer-events-auto self-center rounded-xl border border-emerald-500/40 bg-slate-900/95 px-4 py-2 text-xs font-bold text-white shadow-2xl animate-bounce">
          ✓ تم نسخ رابط الدرس لمشاركته!
        </div>
      )}

      {/* Word Quick Tooltip */}
      {selectedWordTooltip && (
        <div dir="rtl" className="pointer-events-auto self-center flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xl">
          <Lightbulb className="w-4 h-4" aria-hidden="true" />
          <span>{selectedWordTooltip}</span>
        </div>
      )}

      {/* Middle & Bottom Container */}
      <div className="pointer-events-auto absolute bottom-3 left-3 right-[68px] flex max-h-[34%] max-w-[720px] flex-col gap-2 overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom,0px)] sm:bottom-4 sm:left-4 sm:right-[76px]">
        {/* Left/Main Subtitle and Metadata card */}
        <div className="flex min-w-0 flex-col gap-2">
          {/* Subtitle Box (English & Arabic) */}
          {subtitlesMode !== 'none' && currentLine && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md transition-all sm:p-3.5">
              {/* Speaker name */}
              <div dir="rtl" className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-sky-400" />
                  {currentLine.speakerId === lesson.characterA.id
                    ? `${lesson.characterA.name} (${lesson.characterA.roleAr})`
                    : `${lesson.characterB.name} (${lesson.characterB.roleAr})`}
                </span>
                
                {/* Sentence progress dots */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono-num">
                    {lineIndex + 1} / {totalLines}
                  </span>
                  {lesson.learningNoteAr && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLearningNote((visible) => !visible);
                      }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${showLearningNote ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      aria-label={showLearningNote ? 'إخفاء الملاحظة التعليمية' : 'عرض الملاحظة التعليمية'}
                      aria-expanded={showLearningNote}
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStopSpeaking();
                    }}
                    className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                    aria-label="إيقاف النطق"
                    title="إيقاف النطق"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* English Sentence with Interactive Words */}
              {(subtitlesMode === 'both' || subtitlesMode === 'en') && (
                <div
                  dir="ltr"
                  className="max-h-20 overflow-y-auto no-scrollbar text-left font-en font-bold text-white text-sm sm:text-base leading-relaxed tracking-wide flex flex-wrap content-start gap-x-1.5 gap-y-0.5 break-words"
                >
                  {currentLine.textEn.split(' ').map((w, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleWordTap(e, w)}
                      className="hover:text-amber-300 hover:underline active:scale-95 transition-transform"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}

              {/* Arabic Translation */}
              {(subtitlesMode === 'both' || subtitlesMode === 'ar') && (
                <p
                  dir="rtl"
                  className="mt-2 max-h-20 overflow-y-auto no-scrollbar break-words border-t border-slate-700/70 pt-2 text-right text-sm font-medium leading-relaxed text-slate-200 sm:text-base"
                >
                  {currentLine.textAr}
                </p>
              )}
              {showLearningNote && lesson.learningNoteAr && (
                <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5 text-right text-xs leading-relaxed text-amber-100" dir="rtl">
                  <span className="mb-1 block font-bold text-amber-300">ملاحظة تعليمية</span>
                  {lesson.learningNoteAr}
                </p>
              )}
            </div>
          )}

          {/* Subtitle hidden notice */}
          {subtitlesMode === 'none' && (
            <div dir="rtl" className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-sm">
              <span>الترجمة مخفية — وضع تحدي الاستماع</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStopSpeaking();
                }}
                className="shrink-0 rounded-lg p-1.5 text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                aria-label="إيقاف النطق"
                title="إيقاف النطق"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Progress bar across current dialogue */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="bg-sky-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${((lineIndex + 1) / totalLines) * 100}%` }}
            />
          </div>
        </div>
      </div>

        {/* Right TikTok Action Bar (Sidebar) */}
        <div className="pointer-events-auto absolute right-1.5 top-[43%] flex max-h-[calc(100%-170px)] w-12 -translate-y-1/2 flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-slate-950/35 py-2 backdrop-blur-sm no-scrollbar sm:right-2 sm:w-14 sm:gap-2">
          {/* Explicit playback control stays usable while speech is loading. */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-full active:scale-90 transition-transform"
            aria-label={isPlaying ? 'إيقاف الدرس مؤقتًا' : 'تشغيل الدرس'}
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/70 bg-sky-500/90 text-slate-950 shadow-lg shadow-sky-500/20 sm:h-11 sm:w-11">
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </div>
          </button>

          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            className="group relative flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="إعجاب بالدرس"
            title="إعجاب"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors sm:h-11 sm:w-11 ${
                isLiked
                  ? 'bg-rose-500/90 text-white border-rose-400 shadow-rose-500/30'
                  : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
              />
            </div>
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-slate-950 px-1 text-center text-[9px] font-bold text-white font-mono-num drop-shadow">
              {lesson.likesCount + (isLiked ? 1 : 0)}
            </span>
          </button>

          {/* Bookmark / Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="group relative flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="إضافة الدرس للمفضلة"
            title="المفضلة"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors sm:h-11 sm:w-11 ${
                isFavorited
                  ? 'bg-amber-500/90 text-slate-950 border-amber-300 shadow-amber-500/30'
                  : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`}
              />
            </div>
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-slate-950 px-1 text-center text-[9px] font-bold text-white font-mono-num drop-shadow">
              {lesson.savedCount + (isFavorited ? 1 : 0)}
            </span>
          </button>

          {/* Vocabulary Drawer button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenVocabDrawer();
            }}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="فتح مفردات الدرس"
            title="المفردات"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/50 bg-slate-900/90 text-emerald-400 shadow-lg backdrop-blur-md hover:bg-slate-800 sm:h-11 sm:w-11">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-black text-slate-950">
              {lesson.vocabulary.length}
            </span>
          </button>

          {/* Speech Speed toggle (1.0x, 0.75x, 0.5x) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCycleSpeed();
            }}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="تغيير سرعة النطق"
            title="سرعة النطق"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-white shadow-lg backdrop-blur-md hover:bg-slate-800 sm:h-11 sm:w-11">
              <span className="text-[10px] font-black font-mono-num text-amber-400">
                {playbackSpeed}x
              </span>
            </div>
          </button>

          {/* Subtitles Mode Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCycleSubtitles();
            }}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="تغيير عرض الترجمة"
            title={subtitlesMode === 'both' ? 'العربية والإنجليزية' : subtitlesMode === 'en' ? 'الإنجليزية فقط' : 'الترجمة مخفية'}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors sm:h-11 sm:w-11 ${
                subtitlesMode !== 'none'
                  ? 'bg-slate-900/80 text-sky-400 border-sky-500/50'
                  : 'bg-slate-950/90 text-slate-500 border-slate-800'
              }`}
            >
              <Languages className="w-5 h-5" />
            </div>
          </button>

          {/* Replay Line button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplayCurrentLine();
            }}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="إعادة نطق الجملة"
            title="إعادة النطق"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-white shadow-lg backdrop-blur-md hover:bg-slate-800 sm:h-11 sm:w-11">
              <RotateCcw className="w-5 h-5" />
            </div>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full active:scale-90 transition-transform"
            aria-label="مشاركة الدرس"
            title="مشاركة"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-white shadow-lg backdrop-blur-md hover:bg-slate-800 sm:h-11 sm:w-11">
              <Share2 className="w-5 h-5" />
            </div>
          </button>
        </div>
    </div>
  );
};
