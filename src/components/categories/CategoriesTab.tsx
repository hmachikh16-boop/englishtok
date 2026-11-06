import React, { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Search, Sparkles, Play, BookOpen, Clock, Heart, Lock, CheckCircle2, Trophy, Star, ArrowDown, Crown, Footprints, Youtube } from 'lucide-react';
import { Lesson, CategoryKey, UserProfile } from '../../types';
import { CATEGORIES } from '../../data/lessons';
import { CURRICULUM_CONFIG, CURRICULUM_LEVELS } from '../../data/curriculum';
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
import { PremiumIcon } from '../icons/PremiumIcon';
import { LearningBuddy } from '../learning/LearningBuddy';
import {
  MotivationalCardModal,
  MotivationalGoalSpotlight,
  StageMotivationalCards,
} from '../learning/MotivationalCards';
import { PrimaryAvatar } from '../video/PrimaryCharacterArt';
const ReelsViewer = lazy(() =>
  import('../reels/ReelsViewer').then((module) => ({ default: module.ReelsViewer })),
);
import { GoldJourneyPanel } from '../gold/GoldJourneyPanel';
import { GoldErrorBoundary } from '../gold/GoldErrorBoundary';
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
  const libraryRef = useRef<HTMLDetailsElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [examStage, setExamStage] = useState<number | null>(null);
  const [showReels, setShowReels] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [completedStoryIds, setCompletedStoryIds] = useState<Set<string>>(() => readCompletedStories());
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [shelfVisibleCount, setShelfVisibleCount] = useState(6);
  // Only one secondary panel is open at a time so the home screen stays a
  // single, calm path instead of a stack of cards.
  const [homePanel, setHomePanel] = useState<'stories' | 'goals' | 'gold' | 'school' | null>(null);
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
  const toggleHomePanel = useCallback(
    (panel: 'stories' | 'goals' | 'gold' | 'school') => {
      const willOpen = homePanel !== panel;
      setHomePanel(willOpen ? panel : null);
      speechService.playPop();
      if (willOpen && panel === 'stories') {
        window.setTimeout(() => {
          document.querySelector('.story-shelf')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const [libraryPageSize, setLibraryPageSize] = useState(24);
  const [isPending, startTransition] = useTransition();
  const selectedPhase = EDUCATIONAL_PHASES.find((phase) => phase.id === selectedPhaseId);
  const selectedSchoolYear = findSchoolYearRoute(selectedSchoolYearId);
  useEffect(() => {
    if (!selectedSchoolYearId) return;
    routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedSchoolYearId]);
  useEffect(() => {
    setLibraryPageSize(24);
  }, [selectedCategory, selectedLevel, deferredSearchQuery]);
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
      (level) => level.completedCount >= visibleLessonCount && visibleLessonCount < 125,
    );
    if (shouldExpand) setVisibleLessonCount((count) => Math.min(count + 5, 125));
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

  const activeStory = getStoryById(activeStoryId);

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

  const handleOpenLibrary = () => {
    const library = libraryRef.current;
    if (!library) return;
    library.open = true;
    library.scrollIntoView({ behavior: 'smooth', block: 'start' });
    speechService.playPop();
  };

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
    <div className={`journey-home w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-5 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}>
      {!selectedSchoolYear && path.levels.length > 0 && (
        <nav className="path-stage-rail sticky top-0 z-30 -mx-3 border-b border-emerald-100/80 px-3 py-2.5 sm:-mx-6 sm:px-5" aria-label="التنقل بين مراحل المسار">
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
            <button
              type="button"
              onClick={handleOpenLibrary}
              className="path-stage-rail-search shrink-0"
              aria-label="البحث في جميع الدروس"
              title="البحث في جميع الدروس"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
      <section className="path-hero relative overflow-hidden rounded-[2rem] border border-teal-200/10 p-5 shadow-2xl sm:p-7" dir="rtl">
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
        {EDUCATIONAL_PHASES.length > 0 && homePanel === 'school' && <section className="school-phase-explorer home-panel mt-5" aria-labelledby="school-phase-title">
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
        </section>}
        <nav className="home-tools" aria-label="أدوات الصفحة الرئيسية">
          <button
            type="button"
            className={`home-tool ${homePanel === 'stories' ? 'is-active' : ''}`}
            onClick={() => toggleHomePanel('stories')}
            aria-pressed={homePanel === 'stories'}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            القصص
            <span className="home-tool-count">{shelfStories.length}</span>
          </button>
          {!isSchoolYearCourse && path.levels.length > 0 && (
            <button
              type="button"
              className={`home-tool ${homePanel === 'goals' ? 'is-active' : ''}`}
              onClick={() => toggleHomePanel('goals')}
              aria-pressed={homePanel === 'goals'}
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              الأهداف
            </button>
          )}
          {goldEdition ? (
            <button
              type="button"
              className={`home-tool ${homePanel === 'gold' ? 'is-active' : ''}`}
              onClick={() => toggleHomePanel('gold')}
              aria-pressed={homePanel === 'gold'}
            >
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
              Gold+
            </button>
          ) : !IS_STORE_BUILD ? (
            <button type="button" className="home-tool" onClick={() => void openGoldPage()}>
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
              Gold
            </button>
          ) : null}
          {EDUCATIONAL_PHASES.length > 0 && (
            <button
              type="button"
              className={`home-tool ${homePanel === 'school' ? 'is-active' : ''}`}
              onClick={() => toggleHomePanel('school')}
              aria-pressed={homePanel === 'school'}
            >
              <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
              المسارات
            </button>
          )}
        </nav>
        {homePanel === 'goals' && !isSchoolYearCourse && path.levels.length > 0 && (
          <section className="home-panel home-panel-goals" aria-label="الأهداف والبطاقات">
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
          <GoldErrorBoundary>
            <GoldJourneyPanel
              userProfile={userProfile}
              lessons={lessons}
              learningPath={path}
              onSelectLesson={handlePathLessonClick}
              onUpdateProfile={onUpdateProfile}
            />
          </GoldErrorBoundary>
        )}
        {selectedSchoolYear && <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800"><span>{selectedSchoolYear.labelAr}</span><button type="button" onClick={() => setSelectedSchoolYearId(null)} className="underline">عرض المسار كاملًا</button></div>}
        {lessons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-8 text-center" dir="rtl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/15 text-lime-200"><Sparkles className="h-6 w-6" /></span>
            <h3 className="mt-3 text-base font-black text-white">المحتوى قيد الإعداد</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-400">حُذفت جميع الدروس والمستويات السابقة. سيُضاف المنهج الجديد هنا فور اعتماده وإدخاله، وستظهر الدروس بالترتيب مع الاختبارات والتقدم.</p>
          </div>
        ) : (<>
        <div ref={routeRef} className="continuous-route relative mt-6" aria-label="مسار التعلم الكامل" aria-busy={isPending}>
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
                      onSelect={(id) => { openExclusive('story'); setActiveStoryId(id); }}
                    />
                  );
                })}
                {visibleLessonCount < level.lessons.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleLessonCount((count) => Math.min(count + 5, 125))}
                    className="path-node path-show-more-node"
                    aria-label="عرض 5 دروس إضافية"
                  >
                    <span className="path-node-orb path-show-more-orb">
                      <span className="text-lg font-black">+5</span>
                    </span>
                    <span className="path-node-title">عرض المزيد</span>
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
        {homePanel === 'stories' && <aside className="story-shelf home-panel mt-6" aria-label="قصص تعليمية">
          <div className="story-shelf-head">
            <div className="min-w-0">
              <div className="story-shelf-title">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                قصص تعليمية
              </div>
              <p className="story-shelf-sub">
                قصص قصيرة مصوّرة (إنجليزية/فرنسية) لتحسين الفهم والاستماع. اضغط على أي محطة قصة في المسار أو هنا.
              </p>
            </div>
            <span className="story-shelf-count">{shelfStories.length} قصص · المرحلة {shelfStage}</span>
          </div>
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
        </aside>}
        {activeStory && (
          <StoryReader
            story={activeStory}
            language={isFrenchCourse ? 'fr' : 'en'}
            completed={completedStoryIds.has(activeStory.id)}
            onClose={() => setActiveStoryId(null)}
            onComplete={handleStoryComplete}
          />
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400"><ArrowDown className="h-3.5 w-3.5 text-lime-200" />أكمل الدروس بالترتيب لفتح محطات جديدة</div>
        </>)}
      </section>

      {lessons.length > 0 && <details className="lesson-library" dir="rtl" ref={libraryRef}>
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
          className="w-full bg-white border border-emerald-100 rounded-2xl py-3.5 pr-11 pl-4 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors shadow-sm"
        />
        <Search className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
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
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-white text-slate-600 border-emerald-100 hover:border-emerald-300 hover:text-emerald-800'
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
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-white text-slate-600 border-emerald-100 hover:border-emerald-300 hover:text-emerald-800'
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

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar p-1 bg-white rounded-xl border border-emerald-100">
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
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-emerald-800'
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
          visibleLibraryLessons.map((lesson) => {
            const durationMinutes = Math.max(1, Math.ceil(lesson.dialogue.reduce((duration, line) => duration + line.durationSec, 0) / 60));
            return (
            <button
              type="button"
              key={lesson.id}
              onClick={() => handleCardClick(lesson.id)}
              disabled={path.lessonStatusById.get(lesson.id) === 'locked'}
              className={`group flex flex-col gap-2.5 rounded-2xl border p-3.5 text-right shadow-sm transition-all active:scale-[0.99] ${path.lessonStatusById.get(lesson.id) === 'locked' ? 'cursor-not-allowed border-emerald-100 bg-white/60 opacity-60' : 'cursor-pointer border-emerald-100 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg'}`}
            >
              <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                  {/* Avatar badge */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-100 border border-emerald-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                    {lesson.characterA.design
                      ? <PrimaryAvatar design={lesson.characterA.design} className="h-12 w-12" label={lesson.characterA.nameAr} />
                      : lesson.characterA.avatar}
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
                    <h4 className="break-words text-sm font-bold text-white group-hover:text-emerald-700 transition-colors">
                      {lesson.titleAr}
                    </h4>
                    <p dir="ltr" className="text-xs text-slate-400 font-en text-left">
                      {lesson.title}
                    </p>
                  </div>
                </div>

                {/* Play button */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${path.lessonStatusById.get(lesson.id) === 'locked' ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                  {path.lessonStatusById.get(lesson.id) === 'locked' ? <Lock className="h-4 w-4" /> : path.lessonStatusById.get(lesson.id) === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {lesson.descriptionAr}
              </p>

              {/* Lesson metadata footer */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-50 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lesson.vocabulary.length} كلمات</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
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
      </details>}
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
            <Youtube className="h-5 w-5" />
            <span>Reels</span>
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
