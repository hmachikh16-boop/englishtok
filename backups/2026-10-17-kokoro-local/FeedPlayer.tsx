import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  CheckCircle,
  Volume2
} from 'lucide-react';
import { Lesson, UserProfile } from '../../types';
import { CartoonScene } from './CartoonScene';
import { VideoOverlay } from './VideoOverlay';
import { LessonQuizModal } from '../quiz/LessonQuizModal';
import { VocabDrawer } from '../vocab/VocabDrawer';
import { speechService } from '../../services/speechService';

interface FeedPlayerProps {
  lessons: Lesson[];
  initialLessonId?: string;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenCategories: () => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

export const FeedPlayer: React.FC<FeedPlayerProps> = ({
  lessons,
  initialLessonId,
  userProfile,
  onUpdateProfile,
  onOpenCategories,
}) => {
  // Find current lesson index
  const initialIdx = initialLessonId
    ? Math.max(0, lessons.findIndex((l) => l.id === initialLessonId))
    : 0;

  const [currentLessonIdx, setCurrentLessonIdx] = useState(initialIdx);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [replayRequest, setReplayRequest] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(userProfile.settings.playbackSpeed || 1.0);
  const [subtitlesMode, setSubtitlesMode] = useState<'both' | 'en' | 'ar' | 'none'>(
    userProfile.settings.subtitlesMode || 'both'
  );

  // Modals & drawers
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showLessonCompletedBanner, setShowLessonCompletedBanner] = useState(false);

  // Touch tracking for swipe
  const touchStartY = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const autoAdvanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatingHeartTimeouts = useRef(new Set<ReturnType<typeof setTimeout>>());
  const completionContextRef = useRef({ userProfile, onUpdateProfile });
  const completedLessonRef = useRef<string | null>(null);
  completionContextRef.current = { userProfile, onUpdateProfile };

  const currentLesson = lessons[currentLessonIdx] || lessons[0];
  const currentLine = currentLesson.dialogue[currentLineIdx] || null;

  const isLiked = userProfile.likedLessonIds.includes(currentLesson.id);
  const isFavorited = userProfile.favoriteLessonIds.includes(currentLesson.id);

  // Update current index if initialLessonId prop changes from parent
  useEffect(() => {
    if (initialLessonId) {
      const idx = lessons.findIndex((l) => l.id === initialLessonId);
      if (idx !== -1 && idx !== currentLessonIdx) {
        speechService.stopSpeaking();
        completedLessonRef.current = null;
        setCurrentLessonIdx(idx);
        setCurrentLineIdx(0);
        setShowLessonCompletedBanner(false);
      }
    }
  }, [initialLessonId, lessons]);

  // Handle speaking the current line when it changes or play starts
  const playCurrentLine = useCallback(() => {
    if (!currentLine || !isPlaying || showLessonCompletedBanner) return;

    const speaker =
      currentLine.speakerId === currentLesson.characterA.id
        ? currentLesson.characterA
        : currentLesson.characterB;
    const source = `lesson:${currentLesson.id}:${currentLine.id}`;

    speechService.speakText({
      source,
      text: currentLine.textEn,
      rate: playbackSpeed,
      pitch: speaker.voicePitch || 1.0,
      gender: speaker.voiceGender || 'female',
      accent: userProfile.settings.voiceAccent || 'en-US',
      onEnd: () => {
        if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
        autoAdvanceTimeout.current = setTimeout(() => {
          if (currentLineIdx + 1 < currentLesson.dialogue.length) {
            setCurrentLineIdx((prev) => prev + 1);
          } else if (completedLessonRef.current !== currentLesson.id) {
            completedLessonRef.current = currentLesson.id;
            setShowLessonCompletedBanner(true);
            speechService.playSuccessChime();
            const { userProfile: latestProfile, onUpdateProfile: updateProfile } =
              completionContextRef.current;
            const isFirstWatch = !latestProfile.watchedLessonIds.includes(currentLesson.id);
            const newWatched = isFirstWatch
              ? [...latestProfile.watchedLessonIds, currentLesson.id]
              : latestProfile.watchedLessonIds;
            const addedXp = isFirstWatch ? 20 : 5;

            updateProfile({
              watchedLessonIds: newWatched,
              xp: latestProfile.xp + addedXp,
            });
          }
        }, 800);
      },
      onError: () => setIsPlaying(false),
    });
  }, [
    currentLine,
    currentLineIdx,
    currentLesson,
    isPlaying,
    playbackSpeed,
    showLessonCompletedBanner,
    userProfile.settings.voiceAccent,
  ]);

  useEffect(() => {
    if (isPlaying && !showLessonCompletedBanner) {
      playCurrentLine();
    }
    return () => {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
      speechService.stopSpeaking(
        currentLine ? `lesson:${currentLesson.id}:${currentLine.id}` : undefined
      );
    };
  }, [
    currentLine,
    currentLesson.id,
    currentLineIdx,
    currentLessonIdx,
    isPlaying,
    playCurrentLine,
    replayRequest,
    showLessonCompletedBanner,
  ]);

  useEffect(() => {
    const pauseForPageExit = () => {
      setIsPlaying(false);
      speechService.stopSpeaking();
    };
    const pauseWhenHidden = () => {
      if (document.visibilityState === 'hidden') pauseForPageExit();
    };
    window.addEventListener('pagehide', pauseForPageExit);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      window.removeEventListener('pagehide', pauseForPageExit);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      speechService.stopSpeaking();
      floatingHeartTimeouts.current.forEach(clearTimeout);
      floatingHeartTimeouts.current.clear();
    };
  }, []);

  // Navigate Lessons
  const goToNextLesson = () => {
    if (currentLessonIdx + 1 < lessons.length) {
      speechService.stopSpeaking();
      completedLessonRef.current = null;
      setCurrentLessonIdx((prev) => prev + 1);
      setCurrentLineIdx(0);
      setShowLessonCompletedBanner(false);
      speechService.playPop();
    }
  };

  const goToPrevLesson = () => {
    if (currentLessonIdx > 0) {
      speechService.stopSpeaking();
      completedLessonRef.current = null;
      setCurrentLessonIdx((prev) => prev - 1);
      setCurrentLineIdx(0);
      setShowLessonCompletedBanner(false);
      speechService.playPop();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('button, input, textarea, select')) {
        return;
      }
      if (e.key === 'ArrowDown') {
        goToNextLesson();
      } else if (e.key === 'ArrowUp') {
        goToPrevLesson();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLessonIdx, lessons.length]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (diff > 55) {
      // Swiped Up -> Next Lesson
      goToNextLesson();
    } else if (diff < -55) {
      // Swiped Down -> Previous Lesson
      goToPrevLesson();
    }
    touchStartY.current = null;
  };

  // Tap handling (Single tap for Play/Pause, Double tap for Like)
  const handleContainerClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;

    if (timeDiff < 280) {
      // Double tap!
      handleDoubleTap(e.clientX, e.clientY);
    } else {
      // Single tap toggle
      setIsPlaying((p) => !p);
      speechService.playPop();
    }
    lastTapTime.current = now;
  };

  const handleDoubleTap = (clientX: number, clientY: number) => {
    // Add floating heart
    const newHeart: FloatingHeart = {
      id: Date.now(),
      x: clientX,
      y: clientY,
    };
    setFloatingHearts((prev) => [...prev, newHeart]);
    speechService.playHeartSound();

    if (!isLiked) {
      onUpdateProfile({
        likedLessonIds: [...userProfile.likedLessonIds, currentLesson.id],
        xp: userProfile.xp + 5,
      });
    }

    const timeout = setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      floatingHeartTimeouts.current.delete(timeout);
    }, 900);
    floatingHeartTimeouts.current.add(timeout);
  };

  // Toggle Like button in sidebar
  const handleToggleLike = () => {
    speechService.playHeartSound();
    if (isLiked) {
      onUpdateProfile({
        likedLessonIds: userProfile.likedLessonIds.filter((id) => id !== currentLesson.id),
      });
    } else {
      onUpdateProfile({
        likedLessonIds: [...userProfile.likedLessonIds, currentLesson.id],
        xp: userProfile.xp + 5,
      });
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = () => {
    speechService.playPop();
    if (isFavorited) {
      onUpdateProfile({
        favoriteLessonIds: userProfile.favoriteLessonIds.filter((id) => id !== currentLesson.id),
      });
    } else {
      onUpdateProfile({
        favoriteLessonIds: [...userProfile.favoriteLessonIds, currentLesson.id],
        xp: userProfile.xp + 5,
      });
    }
  };

  // Cycle Speed (1.0 -> 0.75 -> 0.5 -> 1.0)
  const handleCycleSpeed = () => {
    const speeds = [1.0, 0.75, 0.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    onUpdateProfile({
      settings: { ...userProfile.settings, playbackSpeed: nextSpeed },
    });
    speechService.playPop();
  };

  // Cycle Subtitles ('both' -> 'en' -> 'none' -> 'both')
  const handleCycleSubtitles = () => {
    const modes: ('both' | 'en' | 'none')[] = ['both', 'en', 'none'];
    const nextIdx = (modes.indexOf(subtitlesMode as 'both' | 'en' | 'none') + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setSubtitlesMode(nextMode);
    onUpdateProfile({
      settings: { ...userProfile.settings, subtitlesMode: nextMode },
    });
    speechService.playPop();
  };

  // Replay current line
  const handleReplayCurrentLine = () => {
    setIsPlaying(true);
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    setReplayRequest((request) => request + 1);
  };

  const handleStopSpeaking = () => {
    speechService.stopSpeaking();
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    setIsPlaying(false);
  };

  const handleOpenQuiz = () => {
    handleStopSpeaking();
    setIsQuizOpen(true);
  };

  const handleOpenVocabDrawer = () => {
    handleStopSpeaking();
    setIsVocabOpen(true);
  };

  const handleCloseVocabDrawer = () => {
    speechService.stopSpeaking();
    setIsVocabOpen(false);
  };

  // Replay entire lesson
  const handleRestartLesson = () => {
    completedLessonRef.current = null;
    setCurrentLineIdx(0);
    setShowLessonCompletedBanner(false);
    setIsPlaying(true);
    speechService.playPop();
  };

  // Save/Unsave word
  const handleToggleSaveWord = (wordId: string) => {
    speechService.playPop();
    const isSaved = userProfile.savedWordIds.includes(wordId);
    if (isSaved) {
      onUpdateProfile({
        savedWordIds: userProfile.savedWordIds.filter((id) => id !== wordId),
      });
    } else {
      onUpdateProfile({
        savedWordIds: [...userProfile.savedWordIds, wordId],
        xp: userProfile.xp + 5,
      });
    }
  };

  // Quiz complete callback
  const handleQuizComplete = (earnedXp: number, passed: boolean) => {
    const isAlreadyCompleted = userProfile.completedLessonIds.includes(currentLesson.id);
    const updatedCompleted = isAlreadyCompleted
      ? userProfile.completedLessonIds
      : [...userProfile.completedLessonIds, currentLesson.id];

    onUpdateProfile({
      xp: userProfile.xp + earnedXp,
      completedLessonIds: passed ? updatedCompleted : userProfile.completedLessonIds,
      quizScores: {
        ...userProfile.quizScores,
        [currentLesson.id]: Math.round((earnedXp / (currentLesson.quiz.length * 15 + 10)) * 100),
      },
    });
  };

  return (
    <div
      className="relative w-full h-full min-h-0 max-w-md mx-auto bg-slate-950 overflow-hidden flex flex-col select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleContainerClick}
    >
      {/* Cartoon Scene Animation */}
      <CartoonScene
        sceneType={currentLesson.sceneType}
        characterA={currentLesson.characterA}
        characterB={currentLesson.characterB}
        currentLine={currentLine}
        isPlaying={isPlaying}
      />

      {/* Floating double-tap hearts */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="fixed pointer-events-none z-50 animate-float-heart"
          style={{ left: heart.x, top: heart.y }}
        >
          <div className="w-16 h-16 text-rose-500 drop-shadow-2xl">
            ❤️
          </div>
        </div>
      ))}

      {/* Big Play/Pause indicator icon when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/25 backdrop-blur-[2px]">
          <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-700/80 text-white flex items-center justify-center shadow-2xl animate-scale-up">
            <Play className="w-8 h-8 fill-current translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Lesson Completed Overlay Banner */}
      {showLessonCompletedBanner && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-xs shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">
              أكملت درس {currentLesson.titleAr}! 🎉
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              أحسنت! استمعت لكل المحادثة وحصلت على +20 XP
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenQuiz();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>ابدأ الاختبار السريع (+15 XP)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestartLesson();
                }}
                className="w-full py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 hover:bg-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تشغيل الدرس</span>
              </button>

              {currentLessonIdx + 1 < lessons.length && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextLesson();
                  }}
                  className="w-full py-2.5 bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold rounded-xl text-xs active:scale-95 transition-transform"
                >
                  الدرس التالي ➔
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main TikTok Action Overlay (Subtitles + Sidebar) */}
      <VideoOverlay
        lesson={currentLesson}
        currentLine={currentLine}
        lineIndex={currentLineIdx}
        totalLines={currentLesson.dialogue.length}
        isPlaying={isPlaying}
        isLiked={isLiked}
        isFavorited={isFavorited}
        playbackSpeed={playbackSpeed}
        subtitlesMode={subtitlesMode}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onToggleLike={handleToggleLike}
        onToggleFavorite={handleToggleFavorite}
        onCycleSpeed={handleCycleSpeed}
        onCycleSubtitles={handleCycleSubtitles}
        onReplayCurrentLine={handleReplayCurrentLine}
        onStopSpeaking={handleStopSpeaking}
        onOpenVocabDrawer={handleOpenVocabDrawer}
        onOpenQuiz={handleOpenQuiz}
        onWordClick={(word) => {
          setIsPlaying(false);
          speechService.speakText({
            source: `lesson-word:${currentLesson.id}:${currentLine?.id ?? 'unknown'}:${word}`,
            text: word,
            rate: 0.8,
            gender: 'female',
            accent: userProfile.settings.voiceAccent || 'en-US',
          });
        }}
      />

      {/* Desktop / Tablet Navigation Side Chevrons */}
      <div className="hidden sm:flex flex-col gap-2 absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevLesson();
          }}
          disabled={currentLessonIdx === 0}
          className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-transform shadow-lg"
          title="الدرس السابق (سهم للأعلى)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNextLesson();
          }}
          disabled={currentLessonIdx + 1 === lessons.length}
          className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-transform shadow-lg"
          title="الدرس التالي (سهم للأسفل)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Quiz Modal */}
      <LessonQuizModal
        lesson={currentLesson}
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onQuizComplete={handleQuizComplete}
      />

      {/* Vocabulary Drawer */}
      <VocabDrawer
        lesson={currentLesson}
        isOpen={isVocabOpen}
        savedWordIds={userProfile.savedWordIds}
        onClose={handleCloseVocabDrawer}
        onToggleSaveWord={handleToggleSaveWord}
      />
    </div>
  );
};
