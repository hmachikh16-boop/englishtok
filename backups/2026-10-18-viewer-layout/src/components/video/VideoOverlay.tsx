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
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-10">
      {/* Top Scrim and Category Info */}
      <div className="pointer-events-auto flex items-center justify-between w-full pt-1">
        <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-amber-400 text-xs font-bold">
            المرحلة {lesson.curriculumStage}
          </span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs font-semibold text-slate-200">
            {lesson.titleAr}
          </span>
        </div>

        {/* Quick Quiz button at top */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenQuiz();
          }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>اختبر نفسك (+15 XP)</span>
        </button>
      </div>

      {/* Share Toast Feedback */}
      {copiedToast && (
        <div className="self-center bg-slate-900/95 text-white border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl animate-bounce">
          ✓ تم نسخ رابط الدرس لمشاركته!
        </div>
      )}

      {/* Word Quick Tooltip */}
      {selectedWordTooltip && (
        <div className="self-center bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border border-amber-300 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" aria-hidden="true" />
          <span>{selectedWordTooltip}</span>
        </div>
      )}

      {/* Middle & Bottom Container */}
      <div className="flex items-end justify-between w-full gap-2">
        {/* Left/Main Subtitle and Metadata card */}
        <div className="pointer-events-auto flex-1 max-w-[calc(100%-65px)] flex flex-col gap-2 pb-1">
          {/* Subtitle Box (English & Arabic) */}
          {subtitlesMode !== 'none' && currentLine && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 p-3.5 sm:p-4 rounded-2xl shadow-2xl transition-all">
              {/* Speaker name */}
              <div className="flex items-center justify-between mb-1.5">
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
                  className="text-left font-en font-bold text-white text-sm sm:text-base leading-relaxed tracking-wide flex flex-wrap gap-x-1.5 gap-y-0.5"
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
                  className="text-right text-sm sm:text-base text-slate-200 font-medium mt-2 pt-2 border-t border-slate-700/70 leading-relaxed"
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
            <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 text-xs text-slate-300">
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
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${((lineIndex + 1) / totalLines) * 100}%` }}
            />
          </div>
        </div>

        {/* Right TikTok Action Bar (Sidebar) */}
        <div className="pointer-events-auto flex flex-col items-center gap-3 shrink-0 pb-1">
          {/* Explicit playback control stays usable while speech is loading. */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label={isPlaying ? 'إيقاف الدرس مؤقتًا' : 'تشغيل الدرس'}
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            <div className="w-11 h-11 rounded-full bg-sky-500/90 text-slate-950 border border-sky-300/70 flex items-center justify-center shadow-lg shadow-sky-500/20">
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-white drop-shadow">
              {isPlaying ? 'إيقاف' : 'تشغيل'}
            </span>
          </button>

          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            className="group flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Like"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border transition-colors ${
                isLiked
                  ? 'bg-rose-500/90 text-white border-rose-400 shadow-rose-500/30'
                  : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
              />
            </div>
            <span className="text-[11px] font-bold text-white font-mono-num drop-shadow">
              {lesson.likesCount + (isLiked ? 1 : 0)}
            </span>
          </button>

          {/* Bookmark / Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="group flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Favorite"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border transition-colors ${
                isFavorited
                  ? 'bg-amber-500/90 text-slate-950 border-amber-300 shadow-amber-500/30'
                  : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`}
              />
            </div>
            <span className="text-[11px] font-bold text-white font-mono-num drop-shadow">
              {lesson.savedCount + (isFavorited ? 1 : 0)}
            </span>
          </button>

          {/* Vocabulary Drawer button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenVocabDrawer();
            }}
            className="relative flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Vocabulary"
          >
            <div className="w-11 h-11 rounded-full bg-slate-900/80 text-emerald-400 border border-emerald-500/50 flex items-center justify-center backdrop-blur-md shadow-lg hover:bg-slate-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-300 drop-shadow">
              {lesson.vocabulary.length} كلمات
            </span>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
              {lesson.vocabulary.length}
            </span>
          </button>

          {/* Speech Speed toggle (1.0x, 0.75x, 0.5x) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCycleSpeed();
            }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Speed"
          >
            <div className="w-11 h-11 rounded-full bg-slate-900/80 text-white border border-slate-700 flex items-center justify-center backdrop-blur-md shadow-lg hover:bg-slate-800">
              <span className="text-xs font-black font-mono-num text-amber-400">
                {playbackSpeed}x
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-300 drop-shadow">
              السرعة
            </span>
          </button>

          {/* Subtitles Mode Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCycleSubtitles();
            }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Subtitles"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border transition-colors ${
                subtitlesMode !== 'none'
                  ? 'bg-slate-900/80 text-sky-400 border-sky-500/50'
                  : 'bg-slate-950/90 text-slate-500 border-slate-800'
              }`}
            >
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 drop-shadow">
              {subtitlesMode === 'both' ? 'عربي+EN' : subtitlesMode === 'en' ? 'EN فقط' : 'مخفية'}
            </span>
          </button>

          {/* Replay Line button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplayCurrentLine();
            }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Replay line"
          >
            <div className="w-11 h-11 rounded-full bg-slate-900/80 text-white border border-slate-700 flex items-center justify-center backdrop-blur-md shadow-lg hover:bg-slate-800">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 drop-shadow">
              إعادة
            </span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Share"
          >
            <div className="w-11 h-11 rounded-full bg-slate-900/80 text-white border border-slate-700 flex items-center justify-center backdrop-blur-md shadow-lg hover:bg-slate-800">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 drop-shadow">
              مشاركة
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
