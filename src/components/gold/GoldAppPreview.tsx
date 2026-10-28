import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, Play, Sparkles } from 'lucide-react';
import type { ActiveTab, Lesson, TargetLanguage, UserProfile } from '../../types';
import { LEARNING_PATH_LESSONS } from '../../data/curriculum';
import { applyGoldCurriculum } from '../../data/goldCurriculum';
import { getLearningPathState } from '../../services/learningPath';
import { TopBar } from '../navigation/TopBar';
import { BottomTabBar } from '../navigation/BottomTabBar';
import { CategoriesTab } from '../categories/CategoriesTab';
import { VocabTab } from '../vocab/VocabTab';
import { GamesTab } from '../games/GamesTab';
import { ProgressTab } from '../progress/ProgressTab';
import { SettingsTab } from '../settings/SettingsTab';
import { ChatTab } from '../chat/ChatTab';
import { LessonSession } from '../learning/LessonSession';

/**
 * The Gold preview deliberately renders the real Lin Go tabs instead of a
 * second, Gold-only interface. The only Gold-specific part is the curriculum
 * and license story around it. That keeps the preview honest: learners see the
 * same top bar, path rail, lesson screen and bottom navigation they already use.
 */

const today = (): string => new Date().toISOString().slice(0, 10);

const createPreviewProfile = (targetLanguage: TargetLanguage): UserProfile => ({
  targetLanguage,
  displayName: 'أحمد',
  profileTagline: 'رحلتي اليومية نحو الطلاقة',
  joinedAt: new Date().toISOString(),
  xp: 128,
  streakDays: 9,
  lastActiveDate: today(),
  likedLessonIds: [],
  favoriteLessonIds: [],
  watchedLessonIds: [],
  completedLessonIds: [],
  savedWordIds: [],
  masteredWordIds: [],
  reviewWordIds: [],
  quizScores: {},
  levelExamResults: {},
  dailyGoalLessons: 2,
  dailyProgress: { date: today(), completedLessonIds: [] },
  settings: {
    playbackSpeed: 1,
    subtitlesMode: 'both',
    soundEffects: true,
    autoNext: false,
    voiceLanguage: targetLanguage,
  },
});

let frenchLessonsCache: Lesson[] | null = null;
let frenchLessonsRequest: Promise<Lesson[]> | null = null;

const loadFrenchLessons = async (): Promise<Lesson[]> => {
  if (frenchLessonsCache) return frenchLessonsCache;
  if (!frenchLessonsRequest) {
    frenchLessonsRequest = fetch('/content/learning-path-fr.json', { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`French content failed (${response.status}).`);
        return response.json() as Promise<{ lessons?: unknown }>;
      })
      .then((payload) => {
        if (!Array.isArray(payload.lessons) || payload.lessons.length === 0) {
          throw new Error('French content is empty.');
        }
        frenchLessonsCache = payload.lessons as Lesson[];
        return frenchLessonsCache;
      })
      .catch((error) => {
        frenchLessonsRequest = null;
        throw error;
      });
  }
  return frenchLessonsRequest;
};

const noop = () => {};

export const GoldAppPreview: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [profile, setProfile] = useState<UserProfile>(() => createPreviewProfile('fr'));
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('categories');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  const learningPath = useMemo(() => getLearningPathState(lessons, profile), [lessons, profile]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingContent(true);
    void loadFrenchLessons()
      .then((frenchLessons) => {
        if (cancelled) return;
        setLessons(applyGoldCurriculum(frenchLessons, 'fr'));
        setProfile(createPreviewProfile('fr'));
        setContentError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setLessons(applyGoldCurriculum(LEARNING_PATH_LESSONS, 'en'));
        setProfile(createPreviewProfile('en'));
        setContentError('تعذّر تحميل محتوى الفرنسية. نعرض مسار الإنجليزية.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingContent(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = useCallback((updated: Partial<UserProfile>) => {
    setProfile((current) => ({
      ...current,
      ...updated,
      settings: {
        ...current.settings,
        ...(updated.settings ?? {}),
      },
    }));
  }, []);

  const changeTab = useCallback((nextTab: ActiveTab) => {
    if (nextTab === 'categories') setSelectedLessonId(null);
    setActiveTab(nextTab);
  }, []);

  const selectLesson = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('lesson');
  }, []);

  const changeLanguage = useCallback((language: TargetLanguage) => {
    setActiveTab('categories');
    setSelectedLessonId(null);
    setContentError(null);
    if (language === 'en') {
      setLessons(applyGoldCurriculum(LEARNING_PATH_LESSONS, 'en'));
      setProfile(createPreviewProfile('en'));
      setIsLoadingContent(false);
      return;
    }
    setIsLoadingContent(true);
    void loadFrenchLessons()
      .then((frenchLessons) => {
        setLessons(applyGoldCurriculum(frenchLessons, 'fr'));
        setProfile(createPreviewProfile('fr'));
      })
      .catch(() => {
        setLessons(applyGoldCurriculum(LEARNING_PATH_LESSONS, 'en'));
        setProfile(createPreviewProfile('en'));
        setContentError('تعذّر تحميل محتوى الفرنسية. نعرض مسار الإنجليزية.');
      })
      .finally(() => setIsLoadingContent(false));
  }, []);

  const resetProgress = useCallback(() => {
    const language = profile.targetLanguage === 'fr' ? 'fr' : 'en';
    setProfile(createPreviewProfile(language));
    setSelectedLessonId(null);
    setActiveTab('categories');
  }, [profile.targetLanguage]);

  const restoreProgress = useCallback((nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setSelectedLessonId(null);
    setActiveTab('categories');
  }, []);

  const refreshContent = useCallback(async (): Promise<boolean> => {
    if (profile.targetLanguage === 'fr') {
      frenchLessonsCache = null;
      frenchLessonsRequest = null;
      setIsLoadingContent(true);
      try {
        const frenchLessons = await loadFrenchLessons();
        setLessons(applyGoldCurriculum(frenchLessons, 'fr'));
        setContentError(null);
        return true;
      } catch {
        setContentError('تعذّر تحديث محتوى الفرنسية.');
        return false;
      } finally {
        setIsLoadingContent(false);
      }
    }
    setLessons(applyGoldCurriculum(LEARNING_PATH_LESSONS, 'en'));
    return true;
  }, [profile.targetLanguage]);

  const selectedLesson =
    activeTab === 'lesson'
      ? lessons.find((lesson) => lesson.id === selectedLessonId) ?? null
      : null;
  const showAppChrome = activeTab !== 'lesson' && activeTab !== 'chat';
  const activeTabForNav: ActiveTab =
    activeTab === 'lesson' || activeTab === 'chat' ? 'categories' : activeTab;

  const appContent = (() => {
    if (isLoadingContent && lessons.length === 0) {
      return (
        <div className="gold-app-loading" role="status" aria-live="polite">
          <span className="gold-app-loading-mark">
            <BookOpen className="h-6 w-6" strokeWidth={2.6} />
          </span>
          <strong>جارٍ تجهيز المسار…</strong>
          <span>نفس دروس Lin Go، بمنهج Gold.</span>
          <Loader2 className="gold-app-loading-spinner h-5 w-5" aria-hidden="true" />
        </div>
      );
    }

    if (activeTab === 'categories') {
      return (
        <CategoriesTab
          lessons={lessons}
          learningPath={learningPath}
          userProfile={profile}
          onUpdateProfile={updateProfile}
          onSelectLesson={selectLesson}
          isPhoneFrameView
          goldEdition
        />
      );
    }

    if (activeTab === 'vocab') {
      return <VocabTab lessons={lessons} userProfile={profile} onUpdateProfile={updateProfile} />;
    }

    if (activeTab === 'games') {
      return <GamesTab lessons={lessons} userProfile={profile} onUpdateProfile={updateProfile} />;
    }

    if (activeTab === 'progress') {
      return (
        <ProgressTab
          userProfile={profile}
          lessons={lessons}
          onUpdateProfile={updateProfile}
          onResumeLearning={() => changeTab('categories')}
        />
      );
    }

    if (activeTab === 'settings') {
      return (
        <SettingsTab
          userProfile={profile}
          hasLessons={lessons.length > 0}
          onUpdateProfile={updateProfile}
          onRetakePlacement={() => changeTab('categories')}
          onChangeTargetLanguage={changeLanguage}
          onResetProgress={resetProgress}
          onRestoreProgress={restoreProgress}
          onRefreshContent={refreshContent}
        />
      );
    }

    if (activeTab === 'chat') {
      return (
        <ChatTab
          key={profile.targetLanguage ?? 'fr'}
          lessons={lessons}
          userProfile={profile}
          onBack={() => changeTab('categories')}
        />
      );
    }

    if (activeTab === 'lesson' && selectedLesson) {
      return (
        <LessonSession
          key={selectedLesson.id}
          lesson={selectedLesson}
          userProfile={profile}
          onUpdateProfile={updateProfile}
          onBackToPath={() => changeTab('categories')}
        />
      );
    }

    return null;
  })();

  return (
    <div className={`gold-app-live ${compact ? 'is-compact' : ''}`}>
      <div className="gold-app-device">
        <div className="gold-app-hardware-top" aria-hidden="true">
          <span className="gold-app-notch" />
          <span className="gold-app-status-time">9:41</span>
          <span className="gold-app-status-icons">▮▮▮ ◔ ▰</span>
        </div>
        <div className="gold-app-screen">
          {showAppChrome && (
            <TopBar
              userProfile={profile}
              isPhoneFrameView
              onToggleFrameView={noop}
              onGoToProgress={() => changeTab('progress')}
              onOpenAiTutor={() => changeTab('chat')}
              goldEdition
            />
          )}
          <main className="gold-app-main">
            {contentError && activeTab === 'categories' && !isLoadingContent && (
              <div className="gold-app-inline-note" role="status">
                {contentError}
              </div>
            )}
            {appContent}
          </main>
          {showAppChrome && (
            <BottomTabBar
              activeTab={activeTabForNav}
              savedWordsCount={profile.savedWordIds.length}
              userStreak={profile.streakDays}
              onChangeTab={changeTab}
            />
          )}
        </div>
      </div>
      <div className="gold-app-live-hint">
        <span>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          معاينة تفاعلية
        </span>
        <small>
          نفس واجهة Lin Go ومسارها. جرّب المسار، الدرس، الإعدادات، أو المعلم الذكي.
        </small>
      </div>
    </div>
  );
};
