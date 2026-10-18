import React, { useState } from 'react';
import { 
  Heart, 
  Bookmark, 
  BookOpen, 
  RotateCcw, 
  Volume2, 
  Languages, 
  Share2, 
  Sparkles,
  HelpCircle
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
  onOpenVocabDrawer: () => void;
  onOpenQuiz: () => void;
  onWordClick?: (word: string) => void;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  lesson,
  currentLine,
  lineIndex,
  totalLines,
  isLiked,
  isFavorited,
  playbackSpeed,
  subtitlesMode,
  onToggleLike,
  onToggleFavorite,
  onCycleSpeed,
  onCycleSubtitles,
  onReplayCurrentLine,
  onOpenVocabDrawer,
  onOpenQuiz,
  onWordClick,
}) => {
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedWordTooltip, setSelectedWordTooltip] = useState<string | null>(null);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `شاهد هذا الدرس الممتع لتعليم الإنجليزية على EnglishTok: "${lesson.titleAr} - ${lesson.title}"\n${window.location.href}`
      );
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2400);
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

    setTimeout(() => {
      setSelectedWordTooltip(null);
    }, 3000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-10">
      {/* Top Scrim and Category Info */}
      <div className="pointer-events-auto flex items-center justify-between w-full pt-1">
        <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-amber-400 text-xs font-bold">
            {lesson.level}
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
        <div className="self-center bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border border-amber-300">
          💡 {selectedWordTooltip}
        </div>
      )}

      {/* Middle & Bottom Container */}
      <div className="flex items-end justify-between w-full gap-2">
        {/* Left/Main Subtitle and Metadata card */}
        <div className="pointer-events-auto flex-1 max-w-[calc(100%-65px)] flex flex-col gap-2 pb-1">
          {/* Subtitle Box (English & Arabic) */}
          {subtitlesMode !== 'none' && currentLine && (
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl shadow-2xl transition-all">
              {/* Speaker name */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-sky-400" />
                  {currentLine.speakerId === lesson.characterA.id
                    ? `${lesson.characterA.name} (${lesson.characterA.roleAr})`
                    : `${lesson.characterB.name} (${lesson.characterB.roleAr})`}
                </span>
                
                {/* Sentence progress dots */}
                <span className="text-[10px] text-slate-400 font-mono-num">
                  {lineIndex + 1} / {totalLines}
                </span>
              </div>

              {/* English Sentence with Interactive Words */}
              {(subtitlesMode === 'both' || subtitlesMode === 'en') && (
                <div
                  dir="ltr"
                  className="text-left font-en font-bold text-white text-sm sm:text-base leading-snug tracking-wide flex flex-wrap gap-1"
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
                  className="text-right text-xs sm:text-sm text-slate-300 font-medium mt-1.5 pt-1.5 border-t border-slate-800/60 leading-relaxed"
                >
                  {currentLine.textAr}
                </p>
              )}
            </div>
          )}

          {/* Subtitle hidden notice */}
          {subtitlesMode === 'none' && (
            <div className="bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-center text-xs text-slate-400">
              🔇 الترجمة مخفية (وضع تحدي الاستماع) - انقر زر [Aa] لإعادتها
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
