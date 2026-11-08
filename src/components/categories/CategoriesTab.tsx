import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Sparkles, Play, BookOpen, CheckCircle2, Lock, Trophy, ArrowDown, Crown, Footprints, Youtube, Map as MapIcon, X, Star, Type } from 'lucide-react';
import { Lesson, UserProfile } from '../../types';
import { CATEGORIES } from '../../data/lessons';
import { CURRICULUM_CONFIG } from '../../data/curriculum';
import { speechService } from '../../services/speechService';
import { IS_GOLD_EDITION } from '../../config/edition';
import { IS_STORE_BUILD } from '../../config/storeBuild';
import { openGoldPage } from '../../services/goldLauncher';
import type { LearningPathState, LessonPathEntry, LessonPathStatus } from '../../services/learningPath';
import {
  EDUCATIONAL_STORIES,
  getStoryById,
  type EducationalStory,
} from '../../data/stories';
import { StoryAvatar, StoryScene } from '../stories/StoryScene';
import { StoryReader } from '../stories/StoryReader';
import { LevelFinalExam } from '../quiz/LevelFinalExam';
import { PrimaryAvatar } from '../video/PrimaryCharacterArt';
import { LearningBuddy } from '../learning/LearningBuddy';
import {
  MotivationalCardModal,
  MotivationalGoalSpotlight,
  StageMotivationalCards,
} from '../learning/MotivationalCards';
const ReelsViewer = lazy(() =>
  import('../reels/ReelsViewer').then((module) => ({ default: module.ReelsViewer })),
);
// The floating entry lives on the path, so its styles must load with this tab
// rather than waiting for the lazy Reels viewer chunk.
import '../reels/reels-fab.css';
import { GoldJourneyPanel } from '../gold/GoldJourneyPanel';
import { GoldErrorBoundary } from '../gold/GoldErrorBoundary';
import { AlphabetWindow } from '../alphabet/AlphabetWindow';
import { EDUCATIONAL_PHASES, findSchoolYearRoute, SCHOOL_YEAR_ALIGNMENT_NOTE } from '../../data/educationalStructure';

const ROUTE_SHIFTS = [0, 30, 44, 30, 0, -30, -44, -30, 0, 30];

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

interface PathLessonNodeProps {
  lesson: Lesson;
  index: number;
  status: LessonPathStatus;
  bestScore: number;
  shiftPercent: number;
  onSelect: (lessonId: string) => void;
}

const PathLessonNode = React.memo(function PathLessonNode({
  lesson,
  index,
  status,
  bestScore,
  shiftPercent,
  onSelect,
}: PathLessonNodeProps) {
  const complete = status === 'completed';
  const current = status === 'current';
  const unavailable = status === 'locked';
  const NodeIcon = CATEGORIES.find((category) => category.key === lesson.category)?.icon ?? BookOpen;
  const starCount = bestScore >= 90 ? 3 : bestScore >= 70 ? 2 : complete ? 1 : 0;

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => onSelect(lesson.id)}
      style={{ transform: `translateX(${shiftPercent}%)` }}
      className={`path-node group ${complete ? 'is-complete' : current ? 'is-current' : unavailable ? 'is-locked' : 'is-open'}`}
      aria-label={`${lesson.titleAr}، ${complete ? 'مكتمل' : current ? 'الدرس الحالي' : unavailable ? 'مقفل' : 'متاح'}`}
    >
      <span className="path-node-orb">
        {complete ? <CheckCircle2 className="path-node-icon path-star h-7 w-7" strokeWidth={3} /> : unavailable ? <Lock className="path-node-icon h-5 w-5" /> : current ? <Footprints className="path-node-icon h-7 w-7" strokeWidth={2.8} /> : <NodeIcon className="path-node-icon h-6 w-6" aria-hidden="true" />}
        <span className="path-node-number">{index + 1}</span>
      </span>
      <span className="path-node-title">{lesson.titleAr}</span>
      {complete && <span className="path-node-stars" aria-label={`${starCount} نجوم`} dir="ltr">{[0, 1, 2].map((star) => <Star key={star} className={star < starCount ? 'earned' : ''} />)}</span>}
      {current && <span className="path-node-hint"><Play className="h-3 w-3 fill-current" /> ابدأ هنا</span>}
      {current && <span className="path-node-guide" aria-hidden="true"><LearningBuddy compact /></span>}
    </button>
  );
});

const STORY_PROGRESS_KEY = 'lingo.completedStories.v1';

const readCompletedStories = (): Set<string> => {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = window.localStorage.getItem(STORY_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [],
    );
  } catch {
    return new Set();
  }
};

const writeCompletedStories = (ids: Set<string>) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage is optional */
  }
};

interface PathStoryNodeProps {
  story: EducationalStory;
  shiftPercent: number;
  completed: boolean;
  locked: boolean;
  onSelect: (storyId: string) => void;
}

const PathStoryNode = React.memo(function PathStoryNode({
  story,
  shiftPercent,
  completed,
  locked,
  onSelect,
}: PathStoryNodeProps) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect(story.id)}
      style={{ transform: `translateX(${shiftPercent}%)` }}
      className={`path-node path-story-node group ${locked ? 'is-locked' : completed ? 'is-complete' : 'is-open'}`}
      aria-label={`قصة ${story.titleAr}، ${story.level}${locked ? '، مقفلة' : completed ? '، أُكملت' : ''}`}
    >
      <span className="path-node-orb path-story-orb">
        <span className="path-story-avatar-wrap" aria-hidden="true">
          <StoryAvatar scene={story.scene} className="path-story-avatar" />
        </span>
        <span className="path-story-badge" aria-hidden="true">
          {locked ? <Lock className="h-2.5 w-2.5" /> : <BookOpen className="h-2.5 w-2.5" />}
          قصة
        </span>
      </span>
      <span className="path-node-title">{story.titleAr}</span>
      <span className="path-node-hint path-story-hint">
        {completed ? (
          <>
            <CheckCircle2 className="h-3 w-3" /> أُكملت
          </>
        ) : (
          'قصة قصيرة'
        )}
      </span>
    </button>
  );
});


interface CategoriesTabProps {
  lessons: Lesson[];
  learningPath: LearningPathState;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSelectLesson: (lessonId: string) => void;
  isPhoneFrameView: boolean;
  /** Lets the interactive Gold preview show the Gold identity in a normal web build. */
  goldEdition?: boolean;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  lessons,
  learningPath,
  userProfile,
  onUpdateProfile,
  onSelectLesson,
  isPhoneFrameView,
  goldEdition = IS_GOLD_EDITION,
}) => {
  const routeRef = useRef<HTMLDivElement>(null);
  const [examStage, setExamStage] = useState<number | null>(null);
  const [showReels, setShowReels] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [completedStoryIds, setCompletedStoryIds] = useState<Set<string>>(() => readCompletedStories());
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [shelfVisibleCount, setShelfVisibleCount] = useState(6);
  // Only one home window is open at a time and the tile grid is replaced by
  // that single window — the home never stacks windows on top of each other.
  const [homePanel, setHomePanel] = useState<'stories' | 'goals' | 'gold' | 'path' | 'school' | 'alphabet' | null>(null);
  const [goalCardDialog, setGoalCardDialog] = useState<{
    cardId: string | null;
    stage: number | null;
  } | null>(null);
  // Single overlay manager: opening one overlay closes the others to avoid
  // stacked windows and keep the UI professional and light.
  const openExclusive = useCallback((next: 'reels' | 'story' | 'exam' | 'goalCard') => {
    if (next !== 'reels') setShowReels(false);
    if (next !== 'story') setActiveStoryId(null);
    if (next !== 'exam') setExamStage(null);
    if (next !== 'goalCard') setGoalCardDialog(null);
  }, []);
  // Stable handler so memoised path nodes do not all re-render when the reader
  // opens or the user taps a word inside it.
  const handlePathStorySelect = useCallback(
    (id: string) => {
      openExclusive('story');
      setActiveStoryId(id);
    },
    [openExclusive],
  );
  const toggleHomePanel = useCallback(
    (panel: 'stories' | 'goals' | 'gold' | 'path' | 'school' | 'alphabet') => {
      const willOpen = homePanel !== panel;
      setHomePanel(willOpen ? panel : null);
      speechService.playPop();
      if (willOpen) {
        // The window replaces the tile grid; bring its header to the top.
        window.setTimeout(() => {
          document.querySelector('.home-window')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 180);
      }
    },
    [homePanel],
  );
  const path = learningPath;
  const isFrenchCourse = userProfile.targetLanguage === 'fr';
  const currentStageNumber = useMemo(
    () => path.levels.find((level) => level.lessons.some((entry) => entry.lesson.id === path.nextLessonId))?.stage
      ?? path.levels[path.levels.length - 1]?.stage
      ?? 1,
    [path.levels, path.nextLessonId],
  );
  const [selectedPathStage, setSelectedPathStage] = useState<number | 'all'>(currentStageNumber);
  const [visibleLessonCount, setVisibleLessonCount] = useState(5);
  const [isPending, startTransition] = useTransition();
  const selectedPhase = EDUCATIONAL_PHASES.find((phase) => phase.id === selectedPhaseId);
  const selectedSchoolYear = findSchoolYearRoute(selectedSchoolYearId);
  useEffect(() => {
    if (!selectedSchoolYearId) return;
    routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedSchoolYearId]);
  const previousCurrentStage = useRef(currentStageNumber);
  useEffect(() => {
    if (selectedPathStage === previousCurrentStage.current) {
      setSelectedPathStage(currentStageNumber);
    }
    previousCurrentStage.current = currentStageNumber;
  }, [currentStageNumber, selectedPathStage]);

  const completedLessonIds = useMemo(
    () => new Set(userProfile.completedLessonIds),
    [userProfile.completedLessonIds],
  );

  const lessonsBySchoolYear = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      if (!lesson.schoolYearId) continue;
      const bucket = map.get(lesson.schoolYearId);
      if (bucket) bucket.push(lesson);
      else map.set(lesson.schoolYearId, [lesson]);
    }
    return map;
  }, [lessons]);

  const schoolYearProgressById = useMemo(() => {
    const progressById = new Map<string, { yearLessons: Lesson[]; completed: number; priorYearsComplete: boolean }>();
    for (const phase of EDUCATIONAL_PHASES) {
      phase.years.forEach((year, yearIndex) => {
        const yearLessons = lessonsBySchoolYear.get(year.id) ?? [];
        const completed = yearLessons.reduce(
          (count, lesson) => count + (completedLessonIds.has(lesson.id) ? 1 : 0),
          0,
        );
        const priorYearsComplete = yearIndex === 0 || phase.years.slice(0, yearIndex).every((priorYear) => {
          const priorLessons = lessonsBySchoolYear.get(priorYear.id) ?? [];
          return priorLessons.length > 0 && priorLessons.every((lesson) => completedLessonIds.has(lesson.id));
        });
        progressById.set(year.id, { yearLessons, completed, priorYearsComplete });
      });
    }
    return progressById;
  }, [completedLessonIds, lessonsBySchoolYear]);

  const getSchoolYearProgress = useCallback((yearId: string) =>
    schoolYearProgressById.get(yearId) ?? { yearLessons: [], completed: 0, priorYearsComplete: true },
  [schoolYearProgressById]);

  const getLessonStatus = useCallback((lesson: Lesson) => {
    if (!lesson.schoolYearId) return path.lessonStatusById.get(lesson.id);
    const { yearLessons, priorYearsComplete } = getSchoolYearProgress(lesson.schoolYearId);
    if (completedLessonIds.has(lesson.id)) return 'completed';
    if (!priorYearsComplete) return 'locked';
    const lessonIndex = yearLessons.findIndex((entry) => entry.id === lesson.id);
    return yearLessons.slice(0, lessonIndex).every((entry) => completedLessonIds.has(entry.id)) ? 'current' : 'locked';
  }, [completedLessonIds, getSchoolYearProgress, path.lessonStatusById]);

  const visibleLevels = useMemo(() => {
    if (selectedSchoolYear?.grade) {
      const { yearLessons, completed, priorYearsComplete } = getSchoolYearProgress(selectedSchoolYear.id);
      let foundCurrent = false;
      const entries = yearLessons.map((lesson) => {
        const isComplete = completedLessonIds.has(lesson.id);
        const status = isComplete ? 'completed' as const
          : !priorYearsComplete || foundCurrent ? 'locked' as const
            : (foundCurrent = true, 'current' as const);
        return { lesson, status };
      });
      return [{
        stage: selectedSchoolYear.grade,
        titleAr: selectedSchoolYear.labelAr,
        subtitleAr: `${yearLessons.length} درسًا بتدرّج مناسب لهذا المسار`,
        lessons: entries,
        completedCount: completed,
        isUnlocked: priorYearsComplete,
        canTakeExam: false,
        examPassed: false,
      }];
    }
    return selectedSchoolYear
      ? path.levels.filter((level) => selectedSchoolYear.stages.includes(level.stage))
      : selectedPathStage === 'all'
        ? path.levels
        : path.levels.filter((level) => level.stage === selectedPathStage);
  }, [completedLessonIds, getSchoolYearProgress, path.levels, selectedPathStage, selectedSchoolYear]);

  useEffect(() => {
    const shouldExpand = visibleLevels.some(
      (level) => level.completedCount >= visibleLessonCount && visibleLessonCount < 1000,
    );
    if (shouldExpand) setVisibleLessonCount((count) => Math.min(count + 5, 1000));
  }, [visibleLevels, visibleLessonCount]);

  const isSchoolYearCourse = Boolean(selectedSchoolYear?.grade);
  const today = new Date().toISOString().slice(0, 10);
  const dailyLessonCount = userProfile.dailyProgress.date === today ? userProfile.dailyProgress.completedLessonIds.length : 0;
  const dailyGoal = Math.max(1, userProfile.dailyGoalLessons);
  const cardProgressByStage = useMemo(
    () => Object.fromEntries(path.levels.map((level) => [level.stage, level.completedCount])) as Record<number, number>,
    [path.levels],
  );
  const nextLessonId = useMemo(() => {
    if (!selectedSchoolYear?.grade) return path.nextLessonId;
    const { yearLessons, priorYearsComplete } = getSchoolYearProgress(selectedSchoolYear.id);
    return priorYearsComplete
      ? yearLessons.find((lesson) => !completedLessonIds.has(lesson.id))?.id ?? path.nextLessonId
      : path.nextLessonId;
  }, [completedLessonIds, getSchoolYearProgress, path.nextLessonId, selectedSchoolYear]);

  const storiesByStage = useMemo(() => {
    const map = new Map<number, EducationalStory[]>();
    for (const story of EDUCATIONAL_STORIES) {
      const bucket = map.get(story.stage);
      if (bucket) bucket.push(story);
      else map.set(story.stage, [story]);
    }
    return map;
  }, []);

  // Only the current stage's stories are shown in the shelf, and they load in
  // small chunks. This keeps the shelf light even with dozens of stories and
  // avoids rendering every illustration at once.
  const shelfStage = selectedPathStage === 'all' ? currentStageNumber : selectedPathStage;
  const shelfStories = useMemo(
    () => storiesByStage.get(shelfStage) ?? [],
    [shelfStage, storiesByStage],
  );
  // Shelf cards follow the same rule as the path: a story opens only after the
  // lesson it sits after has been completed.
  const storyLockById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const level of path.levels) {
      const stories = storiesByStage.get(level.stage) ?? [];
      const lessonCount = level.lessons.length;
      stories.forEach((story, storyIndex) => {
        const slot = lessonCount === 0
          ? 0
          : Math.min(
              lessonCount - 1,
              Math.max(0, Math.round(((storyIndex + 1) * lessonCount) / (stories.length + 1)) - 1),
            );
        const entry = level.lessons[slot];
        map.set(story.id, !level.isUnlocked || !entry || entry.status !== 'completed');
      });
    }
    return map;
  }, [storiesByStage, path.levels]);
  useEffect(() => {
    setShelfVisibleCount(6);
  }, [shelfStage]);

  type StageNode =
    | { type: 'lesson'; entry: LessonPathEntry; index: number }
    | { type: 'story'; story: EducationalStory; locked: boolean };

  /** Lessons with story medallions woven in between, like Duolingo stories. */
  const stageNodes = useMemo(() => {
    const map = new Map<number, StageNode[]>();
    for (const level of visibleLevels) {
      const stories = storiesByStage.get(level.stage) ?? [];
      const lessonCount = level.lessons.length;
      const slots = new Map<number, EducationalStory[]>();
      stories.forEach((story, storyIndex) => {
        const slot = lessonCount === 0
          ? 0
          : Math.min(
              lessonCount - 1,
              Math.max(0, Math.round(((storyIndex + 1) * lessonCount) / (stories.length + 1)) - 1),
            );
        const bucket = slots.get(slot);
        if (bucket) bucket.push(story);
        else slots.set(slot, [story]);
      });
      const nodes: StageNode[] = [];
      const visibleLessons = level.lessons.slice(0, visibleLessonCount);
      visibleLessons.forEach((entry, index) => {
        nodes.push({ type: 'lesson', entry, index });
        const bucket = slots.get(index);
        if (bucket) {
          const storyLocked = !level.isUnlocked || entry.status !== 'completed';
          bucket.forEach((story) => nodes.push({ type: 'story', story, locked: storyLocked }));
        }
      });
      if (lessonCount === 0) {
        (slots.get(0) ?? []).forEach((story) =>
          nodes.push({ type: 'story', story, locked: !level.isUnlocked }),
        );
      }
      map.set(level.stage, nodes);
    }
    return map;
  }, [storiesByStage, visibleLevels, visibleLessonCount]);

  const activeStory = useMemo(() => getStoryById(activeStoryId), [activeStoryId]);

  const handleStoryComplete = useCallback((storyId: string) => {
    setCompletedStoryIds((previous) => {
      if (previous.has(storyId)) return previous;
      const next = new Set(previous);
      next.add(storyId);
      writeCompletedStories(next);
      return next;
    });
    speechService.playPop();
  }, []);

  const routeLayout = useMemo(() => {
    const rows = visibleLevels.flatMap((level) => [
      { type: 'unit' as const, level },
      ...(stageNodes.get(level.stage) ?? []).map((node) =>
        node.type === 'lesson'
          ? { type: 'lesson' as const, level, entry: node.entry, index: node.index }
          : { type: 'story' as const, level, story: node.story },
      ),
      ...(!isSchoolYearCourse ? [{ type: 'exam' as const, level }] : []),
    ]);
    let nodeIndex = 0;
    const shiftByLessonId = new Map<string, number>();
    const shiftByStoryId = new Map<string, number>();
    const shiftByExamStage = new Map<number, number>();
    const pointsByStage = new Map<number, Array<{ x: number; y: number }>>();

    for (const row of rows) {
      if (row.type === 'unit') continue;
      const shift = ROUTE_SHIFTS[nodeIndex % ROUTE_SHIFTS.length];
      const shiftPercent = (shift * 100) / 470;
      if (row.type === 'lesson') shiftByLessonId.set(row.entry.lesson.id, shiftPercent);
      else if (row.type === 'story') shiftByStoryId.set(row.story.id, shiftPercent);
      else shiftByExamStage.set(row.level.stage, shiftPercent);
      const points = pointsByStage.get(row.level.stage) ?? [];
      points.push({ x: 50 + shiftPercent, y: points.length * 112 + 56 });
      pointsByStage.set(row.level.stage, points);
      nodeIndex += 1;
    }

    const stageRoutes = new Map<number, { path: string; height: number }>();
    for (const level of visibleLevels) {
      const points = pointsByStage.get(level.stage) ?? [];
      const first = points[0];
      if (!first) {
        stageRoutes.set(level.stage, { path: '', height: 0 });
        continue;
      }
      let path = `M 50 0 C 50 26, ${first.x} 30, ${first.x} ${first.y}`;
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        path += ` C ${previous.x} ${previous.y + 38}, ${current.x} ${current.y - 38}, ${current.x} ${current.y}`;
      }
      stageRoutes.set(level.stage, { path, height: points.length * 112 });
    }

    return { shiftByLessonId, shiftByStoryId, shiftByExamStage, stageRoutes };
  }, [isSchoolYearCourse, stageNodes, visibleLevels]);

  const handleCardClick = useCallback((id: string) => {
    const lesson = lessons.find((entry) => entry.id === id);
    if (lesson && getLessonStatus(lesson) === 'locked') return;
    speechService.playPop();
    onSelectLesson(id);
  }, [getLessonStatus, lessons, onSelectLesson]);

  const handlePathLessonClick = useCallback((id: string) => {
    speechService.playPop();
    onSelectLesson(id);
  }, [onSelectLesson]);

  const handleSelectPathStage = useCallback((stage: number | 'all') => {
    const home = document.querySelector<HTMLElement>('.journey-home');
    setSelectedPhaseId(null);
    setSelectedSchoolYearId(null);
    startTransition(() => setSelectedPathStage(stage));
    speechService.playPop();
    if (home && home.scrollTop > 120) {
      routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [startTransition]);

  const openGoalCard = useCallback((cardId: string) => {
    openExclusive('goalCard');
    setGoalCardDialog({ cardId, stage: null });
  }, [openExclusive]);

  const openGoalGallery = useCallback((stage: number) => {
    openExclusive('goalCard');
    setGoalCardDialog({ cardId: null, stage });
  }, [openExclusive]);

  const openGoalBrowser = useCallback(() => {
    openExclusive('goalCard');
    setGoalCardDialog({ cardId: null, stage: null });
  }, [openExclusive]);

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
    <div className={`journey-home w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5 ${isPhoneFrameView ? 'is-phone-frame' : ''} ${activeStoryId ? 'is-story-open' : ''}`}>
      <section className={`path-hero relative overflow-hidden rounded-[2rem] border border-teal-200/10 p-5 shadow-2xl sm:p-7 ${activeStoryId ? 'is-story-open' : ''}`} dir="rtl">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="path-hero-intro-zone">
        <div className="path-hero-intro relative flex flex-wrap items-center justify-between gap-4">
          <div className="path-hero-copy">
            <p className="flex items-center gap-2 text-xs font-black text-teal-200">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_#bef264]" />
              {goldEdition
                ? 'رحلتك في Lin Go Gold'
                : isFrenchCourse
                  ? 'رحلتك في المسار الفرنسي'
                  : 'رحلتك في Lin Go'}
              {goldEdition && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300/50 bg-amber-300/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-amber-200">
                  <Crown className="h-2.5 w-2.5" strokeWidth={2.8} aria-hidden="true" />
                  Gold
                </span>
              )}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">كل يوم، خطوة أقرب للطلاقة</h2>
            <p className="mt-2 max-w-lg text-xs leading-6 text-slate-300">{lessons.length === 0 ? 'المحتوى فارغ حالياً: حُذفت جميع الدروس والمستويات السابقة، وسيُضاف المنهج الجديد هنا بعد اعتماده.' : `${path.levels.length} مستويات و${path.totalLessons} درسًا في المسار ${isFrenchCourse ? 'الفرنسي' : 'العام'}.`}</p>
          </div>
          <div className="path-hero-summary flex items-center gap-3">
            <div><div className="text-lg font-black text-white">{path.completedCount}<span className="text-slate-400">/{path.totalLessons}</span></div><div className="text-[10px] text-slate-300">درس مكتمل</div></div>
            <button type="button" disabled={!nextLessonId} onClick={() => nextLessonId && handleCardClick(nextLessonId)} className="path-start-button mr-1 flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-lime-300/20 hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4 fill-current" /> {path.completedCount > 0 ? 'تابع التعلّم' : 'ابدأ الآن'}</button>
          </div>
        </div>
        <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-lime-300 via-teal-300 to-cyan-300 transition-[width] duration-700" style={{ width: `${path.totalLessons ? (path.completedCount / path.totalLessons) * 100 : 0}%` }} /></div>
        <div className="daily-goal-card relative mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <span className="daily-goal-icon"><Sparkles className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-[11px] font-black"><span>هدف اليوم</span><span>{dailyLessonCount}/{dailyGoal} دروس</span></div><div className="daily-goal-track mt-1.5 h-1.5 overflow-hidden rounded-full"><div className="daily-goal-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, (dailyLessonCount / dailyGoal) * 100)}%` }} /></div></div>
          {dailyLessonCount >= dailyGoal && <span className="daily-goal-done"><CheckCircle2 className="h-4 w-4" /> اكتمل</span>}
        </div>

        </div>
        {homePanel === 'school' && (
          <section className="home-window" aria-label="مسارات الدراسة">
            <header className="home-window-head">
              <button type="button" className="home-window-back" onClick={() => setHomePanel(null)} aria-label="إغلاق النافذة">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h3 className="home-window-title">مسارات الدراسة</h3>
                <p className="home-window-sub">تعلّم بترتيب الأطوار والسنوات الدراسية</p>
              </div>
            </header>
            <section className="school-phase-explorer" aria-labelledby="school-phase-title">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div><h3 id="school-phase-title" className="text-sm font-black text-slate-800">التعلّم حسب الطور الدراسي أو المستوى</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">اختر طورًا أو مستوى، ثم السنة أو الوحدة، لعرض وحدات المحتوى المرتبطة بها.</p></div>
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
            <div className="school-year-list" aria-label="اسحب لاختيار السنة الدراسية أو الوحدة">
              <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-800"><selectedPhase.icon className="h-4 w-4" />{selectedPhase.titleAr}</div>
              <div className="school-year-options">
                {selectedPhase.years.map((year) => {
                  const yearIsSelected = selectedSchoolYearId === year.id;
                  const schoolProgress = year.grade ? getSchoolYearProgress(year.id) : null;
                  const unlocked = schoolProgress?.priorYearsComplete ?? year.stages.some((stage) => path.levels.find((level) => level.stage === stage)?.isUnlocked);
                  const progressLabel = schoolProgress
                    ? `${schoolProgress.completed}/${schoolProgress.yearLessons.length} درسًا · ${unlocked ? 'متاح' : 'أكمل السنة السابقة أولًا'}`
                    : unlocked ? 'متاح للمراجعة والتعلّم' : 'يُفتح بعد التقدم في المسار';
                  return <button key={year.id} type="button" disabled={!unlocked} onClick={() => setSelectedSchoolYearId(year.id)} className={`school-year-option ${yearIsSelected ? 'is-selected' : ''}`}>
                    <span>{year.labelAr}</span><small>{progressLabel}</small>
                  </button>;
                })}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{SCHOOL_YEAR_ALIGNMENT_NOTE}</p>
            </div>
          )}
            </section>
            {selectedSchoolYear && (
              <div className="school-year-banner mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] font-bold">
                <span>{selectedSchoolYear.labelAr}</span>
                <button type="button" onClick={() => { setSelectedSchoolYearId(null); setSelectedPhaseId(null); }} className="underline">عرض المسار كاملًا</button>
              </div>
            )}
          </section>
        )}
        {homePanel === null && lessons.length > 0 && (
          <nav className="home-windows" aria-label="نوافذ الصفحة الرئيسية">
            {path.levels.length > 0 && (
              <button type="button" className="home-window-tile is-wide" onClick={() => toggleHomePanel('path')}>
                <span className="home-tile-medallion" aria-hidden="true"><MapIcon /></span>
                <span className="home-tile-copy">
                  <strong>مسار التعلم</strong>
                  <small>خريطة الرحلة · المرحلة {currentStageNumber} · {path.totalLessons} درسًا</small>
                </span>
              </button>
            )}
            <button type="button" className="home-window-tile" onClick={() => toggleHomePanel('stories')}>
              <span className="home-tile-medallion" aria-hidden="true"><BookOpen /></span>
              <span className="home-tile-copy">
                <strong>القصص</strong>
                <small>{shelfStories.length} قصّة مصوّرة</small>
              </span>
            </button>
            <button type="button" className="home-window-tile" onClick={() => toggleHomePanel('alphabet')}>
              <span className="home-tile-medallion" aria-hidden="true"><Type /></span>
              <span className="home-tile-copy">
                <strong>الحروف الأبجدية</strong>
                <small>26 حرفًا · تعلّم بالذكاء</small>
              </span>
            </button>
            {!isSchoolYearCourse && path.levels.length > 0 && (
              <button type="button" className="home-window-tile" onClick={() => toggleHomePanel('goals')}>
                <span className="home-tile-medallion" aria-hidden="true"><Trophy /></span>
                <span className="home-tile-copy">
                  <strong>الأهداف</strong>
                  <small>بطاقات التحفيز</small>
                </span>
              </button>
            )}
            {goldEdition ? (
              <button type="button" className="home-window-tile" onClick={() => toggleHomePanel('gold')}>
                <span className="home-tile-medallion" aria-hidden="true"><Crown /></span>
                <span className="home-tile-copy">
                  <strong>Gold+</strong>
                  <small>كل المزايا مفتوحة</small>
                </span>
              </button>
            ) : !IS_STORE_BUILD ? (
              <button type="button" className="home-window-tile" onClick={() => void openGoldPage()}>
                <span className="home-tile-medallion" aria-hidden="true"><Crown /></span>
                <span className="home-tile-copy">
                  <strong>Gold</strong>
                  <small>جرّب النسخة الذهبية</small>
                </span>
              </button>
            ) : null}
            {EDUCATIONAL_PHASES.length > 0 && (
              <button type="button" className="home-window-tile" onClick={() => toggleHomePanel('school')}>
                <span className="home-tile-medallion" aria-hidden="true"><Footprints /></span>
                <span className="home-tile-copy">
                  <strong>مسارات الدراسة</strong>
                  <small>طور دراسي أو مستوى</small>
                </span>
              </button>
            )}
          </nav>
        )}
        {homePanel === 'goals' && !isSchoolYearCourse && path.levels.length > 0 && (
          <section className="home-window" aria-label="الأهداف والبطاقات">
            <header className="home-window-head">
              <button type="button" className="home-window-back" onClick={() => setHomePanel(null)} aria-label="إغلاق النافذة">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h3 className="home-window-title">الأهداف والبطاقات</h3>
                <p className="home-window-sub">كل درس تكمله يفتح بطاقة جديدة</p>
              </div>
            </header>
            <MotivationalGoalSpotlight
              progressByStage={cardProgressByStage}
              onBrowse={openGoalBrowser}
            />
            <StageMotivationalCards
              stage={currentStageNumber}
              completedLessons={path.levels.find((level) => level.stage === currentStageNumber)?.completedCount ?? 0}
              onOpenCard={openGoalCard}
              onOpenGallery={openGoalGallery}
            />
          </section>
        )}
        {homePanel === 'gold' && goldEdition && (
          <section className="home-window" aria-label="مزايا Gold">
            <header className="home-window-head">
              <button type="button" className="home-window-back" onClick={() => setHomePanel(null)} aria-label="إغلاق النافذة">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h3 className="home-window-title">Gold+</h3>
                <p className="home-window-sub">تقدّم غير محدود ومزايا خاصة</p>
              </div>
            </header>
            <GoldErrorBoundary>
              <GoldJourneyPanel
                userProfile={userProfile}
                lessons={lessons}
                learningPath={path}
                onSelectLesson={handlePathLessonClick}
                onUpdateProfile={onUpdateProfile}
              />
            </GoldErrorBoundary>
          </section>
        )}
        {lessons.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-8 text-center" dir="rtl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/15 text-lime-200"><Sparkles className="h-6 w-6" /></span>
            <h3 className="mt-3 text-base font-black text-white">المحتوى قيد الإعداد</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-400">حُذفت جميع الدروس والمستويات السابقة. سيُضاف المنهج الجديد هنا فور اعتماده وإدخاله، وستظهر الدروس بالترتيب مع الاختبارات والتقدم.</p>
          </div>
        )}
        {homePanel === 'path' && path.levels.length > 0 && (
          <section className="home-window home-window-path" aria-label="مسار التعلم">
            <header className="home-window-head">
              <button type="button" className="home-window-back" onClick={() => setHomePanel(null)} aria-label="إغلاق النافذة">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h3 className="home-window-title">مسار التعلم</h3>
                <p className="home-window-sub">{path.completedCount}/{path.totalLessons} درسًا مكتملًا · افتح المراحل بالترتيب</p>
              </div>
            </header>
            <nav className="path-stage-rail" aria-label="التنقل بين مراحل المسار">
              <div className="flex items-center gap-2">
                <span className="path-stage-rail-label shrink-0">المراحل</span>
                <div className="path-stage-rail-track flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectPathStage('all')}
                    aria-pressed={selectedPathStage === 'all'}
                    className={`path-stage-chip ${selectedPathStage === 'all' ? 'is-active' : ''}`}
                  >
                    الكل
                  </button>
                  {path.levels.map((level) => {
                    const active = selectedPathStage === level.stage;
                    const hasCurrent = level.lessons.some((entry) => entry.lesson.id === path.nextLessonId);
                    return (
                      <button
                        key={level.stage}
                        type="button"
                        onClick={() => handleSelectPathStage(level.stage)}
                        aria-label={`المرحلة ${level.stage}${level.examPassed ? '، مكتملة' : !level.isUnlocked ? '، مقفلة' : ''}`}
                        aria-pressed={active}
                        className={`path-stage-chip ${active ? 'is-active' : ''} ${!level.isUnlocked ? 'is-locked' : ''}`}
                      >
                        <span>{level.stage}</span>
                        {!level.isUnlocked && <Lock className="h-3 w-3" aria-hidden="true" />}
                        {hasCurrent && <span className="path-stage-chip-dot" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
            <div ref={routeRef} className="continuous-route relative" aria-label="مسار التعلم الكامل" aria-busy={isPending}>
          {visibleLevels.map((level) => {
            const locked = !level.isUnlocked;
            const color = [
              'from-lime-300 to-emerald-300', 'from-emerald-300 to-green-300',
              'from-green-300 to-lime-300', 'from-lime-300 to-teal-300',
              'from-teal-300 to-emerald-300',
            ][(level.stage - 1) % 5];
            const examNodeClass = level.examPassed ? 'is-complete' : level.canTakeExam ? 'is-current' : 'is-locked';
            const stageRoute = routeLayout.stageRoutes.get(level.stage) ?? { path: '', height: 0 };
            return <div key={level.stage} data-stage={level.stage} className={`path-stage continuous-route-unit ${locked ? 'is-stage-locked' : ''}`}>
              <div className="path-stage-heading flex flex-wrap items-center justify-between gap-2">
                <div><div className="flex items-center gap-2 text-sm font-black text-white"><span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-slate-950`}>{locked ? <Lock className="h-4 w-4" /> : level.stage}</span>{isSchoolYearCourse ? level.titleAr : <>المرحلة {level.stage} <span className="text-teal-100">· {level.titleAr}</span></>}</div><p className="mt-1 text-[10px] text-slate-400">{level.subtitleAr}</p></div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold text-slate-300">{level.completedCount}/{level.lessons.length} درس</span>
              </div>
              <div className="path-nodes continuous-route-nodes" aria-label={`دروس المرحلة ${level.stage}`}>
                {stageRoute.path && (
                  <svg
                    className="continuous-route-ribbon stage-route-ribbon"
                    viewBox={`0 0 100 ${stageRoute.height}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d={stageRoute.path} />
                  </svg>
                )}
                {(stageNodes.get(level.stage) ?? []).map((node) => {
                  if (node.type === 'lesson') {
                    const { lesson, status } = node.entry;
                    return (
                      <PathLessonNode
                        key={lesson.id}
                        lesson={lesson}
                        index={node.index}
                        status={status}
                        bestScore={userProfile.quizScores[lesson.id] ?? 0}
                        shiftPercent={routeLayout.shiftByLessonId.get(lesson.id) ?? 0}
                        onSelect={handlePathLessonClick}
                      />
                    );
                  }
                  return (
                    <PathStoryNode
                      key={node.story.id}
                      story={node.story}
                      shiftPercent={routeLayout.shiftByStoryId.get(node.story.id) ?? 0}
                      completed={completedStoryIds.has(node.story.id)}
                      locked={node.locked}
                      onSelect={handlePathStorySelect}
                    />
                  );
                })}
                {visibleLessonCount < level.lessons.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleLessonCount((count) => Math.min(count + 5, 1000))}
                    className="path-node path-show-more-node"
                    aria-label="عرض 5 دروس إضافية"
                  >
                    <span className="path-node-orb path-show-more-orb">
                      <span className="text-lg font-black">+5</span>
                    </span>
                    <span className="path-node-title">عرض المزيد ({Math.max(0, level.lessons.length - visibleLessonCount)} متبقي)</span>
                  </button>
                )}
                {!isSchoolYearCourse && visibleLessonCount >= level.lessons.length && <button
                  type="button"
                  disabled={!level.canTakeExam}
                  onClick={() => { openExclusive('exam'); setExamStage(level.stage); }}
                  style={{ transform: `translateX(${routeLayout.shiftByExamStage.get(level.stage) ?? 0}%)` }}
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
          <div className="path-window-hint"><ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />أكمل الدروس بالترتيب لفتح محطات جديدة</div>
          </section>
        )}
        {homePanel === 'stories' && (
          <section className="home-window home-window-stories" aria-label="قصص تعليمية">
            <header className="home-window-head">
              <button type="button" className="home-window-back" onClick={() => setHomePanel(null)} aria-label="إغلاق النافذة">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h3 className="home-window-title">القصص التعليمية</h3>
                <p className="home-window-sub">قصص مصوّرة بالإنجليزية والفرنسية</p>
              </div>
            </header>
            <aside className="story-shelf" aria-label="قصص تعليمية">
          <div className="story-shelf-grid">
            {shelfStories.slice(0, shelfVisibleCount).map((story) => {
              const done = completedStoryIds.has(story.id);
              const locked = storyLockById.get(story.id) ?? false;
              return (
                <button
                  key={story.id}
                  type="button"
                  disabled={locked}
                  className={`story-shelf-card ${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}`}
                  onClick={() => {
                    if (locked) return;
                    openExclusive('story');
                    setActiveStoryId(story.id);
                  }}
                  aria-label={`اقرأ قصة ${story.titleAr}${locked ? '، مقفلة حتى تصل إليها' : ''}`}
                >
                  <span className="story-shelf-art" aria-hidden="true">
                    <StoryScene scene={story.scene} className="story-shelf-scene" />
                    <span className="story-shelf-level">{story.level}</span>
                    {locked && (
                      <span className="story-shelf-lock">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>
                  <span className="story-shelf-body">
                    <strong className="story-shelf-name">{story.titleAr}</strong>
                    <span className="story-shelf-en">
                      {isFrenchCourse ? story.titleFr : story.titleEn}
                    </span>
                    <span className="story-shelf-meta">
                      <BookOpen className="h-3 w-3" />
                      {story.minutes} دقائق
                      {done && (
                        <span className="story-shelf-done">
                          <CheckCircle2 className="h-3 w-3" /> أُكملت
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {shelfVisibleCount < shelfStories.length && (
            <button
              type="button"
              className="story-shelf-more"
              onClick={() => setShelfVisibleCount((value) => value + 6)}
            >
              عرض المزيد ({shelfStories.length - shelfVisibleCount})
            </button>
          )}
            </aside>
          </section>
        )}
        {homePanel === 'alphabet' && <AlphabetWindow onClose={() => setHomePanel(null)} />}
        {activeStory && (
          <StoryReader
            story={activeStory}
            language={isFrenchCourse ? 'fr' : 'en'}
            completed={completedStoryIds.has(activeStory.id)}
            onClose={() => setActiveStoryId(null)}
            onComplete={handleStoryComplete}
          />
        )}
      </section>

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
            voiceLanguage={userProfile.settings.voiceLanguage}
            onClose={() => setExamStage(null)}
            onComplete={(score, topics, wordIds) => saveLevelExamResult(level.stage, score, topics, wordIds)}
          />
        );
      })()}
      {goalCardDialog && (
        <MotivationalCardModal
          key={`${goalCardDialog.cardId ?? 'gallery'}-${goalCardDialog.stage ?? 'all'}`}
          initialCardId={goalCardDialog.cardId}
          initialStage={goalCardDialog.stage}
          progressByStage={cardProgressByStage}
          onClose={() => setGoalCardDialog(null)}
        />
      )}
      {IS_GOLD_EDITION && (
        <>
          <button type="button" className="reels-fab" onClick={() => { openExclusive('reels'); setShowReels(true); }} aria-label="ريلز Lin Go من يوتيوب">
            <span className="reels-fab-medallion" aria-hidden="true">
              <Youtube />
            </span>
            <span className="reels-fab-copy">
              <strong>Reels</strong>
              <small>يوتيوب</small>
            </span>
            <span className="reels-fab-live" aria-hidden="true" />
          </button>
          {showReels && (
            <Suspense fallback={null}>
              <ReelsViewer userProfile={userProfile} onClose={() => setShowReels(false)} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
};
