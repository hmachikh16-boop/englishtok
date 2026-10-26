/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ActiveTab, Lesson, TargetLanguage, UserProfile } from './types';
import { LEARNING_PATH_LESSONS } from './data/curriculum';
import { getLearningPathState } from './services/learningPath';
import { getStoredProfile, saveProfile } from './services/storageService';
import { switchLearningLanguage } from './services/languageService';
import {
  loadGameProgress,
  resetGameProgress,
  saveGameProgress,
  type GameProgress,
} from './services/gameProgressService';
import {
  clearPreImportSnapshot,
  savePreImportSnapshot,
} from './services/progressBackupService';
import { fetchLatestLearningPath, getCachedLearningPath } from './services/contentService';
import { checkForAppUpdate, type AppUpdateManifest } from './services/appUpdateService';
import { downloadAndInstallAppUpdate } from './services/appUpdateLauncher';
import { IS_STORE_BUILD } from './config/storeBuild';
import {
  SPEECH_STATUS_EVENT,
  SPEECH_UNAVAILABLE_EVENT,
  speechService,
} from './services/speechService';
import { TopBar } from './components/navigation/TopBar';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { CategoriesTab } from './components/categories/CategoriesTab';
import { VocabTab } from './components/vocab/VocabTab';
import { GamesTab } from './components/games/GamesTab';
import { ProgressTab } from './components/progress/ProgressTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { ChatTab } from './components/chat/ChatTab';
import { LessonSession } from './components/learning/LessonSession';
import { PlacementAssessmentGate } from './components/placement/PlacementAssessmentGate';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getStoredProfile());
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const cached = getCachedLearningPath(userProfile.targetLanguage ?? 'en');
    if (cached) return cached;
    return userProfile.targetLanguage === 'fr' ? [] : LEARNING_PATH_LESSONS;
  });
  const [placementGateOpen, setPlacementGateOpen] = useState(
    () => !userProfile.targetLanguage || !userProfile.placementAssessment?.result,
  );
  const [contentLoading, setContentLoading] = useState(false);
  const learningPath = useMemo(
    () => getLearningPathState(lessons, userProfile),
    [
      lessons,
      userProfile.completedLessonIds,
      userProfile.levelExamResults,
      userProfile.placementAssessment?.result?.suggestedStage,
    ],
  );
  const vocabularyIds = useMemo(
    () => new Set(lessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.id))),
    [lessons],
  );
  const savedWordsCount = useMemo(
    () => userProfile.savedWordIds.filter((id) => vocabularyIds.has(id)).length,
    [userProfile.savedWordIds, vocabularyIds],
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('categories');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(learningPath.nextLessonId);
  const [isPhoneFrameView, setIsPhoneFrameView] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [speechProgress, setSpeechProgress] = useState<number | null>(null);
  const speechNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [availableAppUpdate, setAvailableAppUpdate] = useState<AppUpdateManifest | null>(null);
  const [updateDownloadError, setUpdateDownloadError] = useState<string | null>(null);
  const [updateOpenMessage, setUpdateOpenMessage] = useState<string | null>(null);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState<number | null>(null);
  const [isOpeningAppUpdate, setIsOpeningAppUpdate] = useState(false);
  const notificationTop = activeTab === 'lesson'
    ? 'calc(env(safe-area-inset-top, 0px) + 12px)'
    : isPhoneFrameView
      ? 'calc(env(safe-area-inset-top, 0px) + 112px)'
      : 'calc(env(safe-area-inset-top, 0px) + 74px)';

  useEffect(() => {
    if (IS_STORE_BUILD || Capacitor.getPlatform() !== 'android') return;

    let isMounted = true;
    const runUpdateCheck = () => {
      void CapacitorApp.getInfo()
        .then(({ version }) => checkForAppUpdate(version))
        .then((update) => {
          if (isMounted && update) setAvailableAppUpdate(update);
        })
        .catch((error: unknown) => {
          console.warn('Unable to check for Lin Go updates:', error);
        });
    };

    runUpdateCheck();
    const resumeListener = CapacitorApp.addListener('resume', runUpdateCheck);

    return () => {
      isMounted = false;
      void resumeListener.then((handle) => handle.remove());
    };
  }, []);

  const handleOpenAppUpdate = async () => {
    if (!availableAppUpdate) return;
    setUpdateDownloadError(null);
    setUpdateOpenMessage(null);
    setUpdateDownloadProgress(0);
    setIsOpeningAppUpdate(true);
    try {
      await downloadAndInstallAppUpdate(availableAppUpdate, (progress) => {
        setUpdateDownloadProgress(progress.percent);
      });
      setUpdateOpenMessage(
        'اكتمل تنزيل التحديث. أكمل خطوات التثبيت التي يعرضها Android؛ لن يبدأ التثبيت دون موافقتك.',
      );
    } catch (error) {
      console.error('Failed to download the Lin Go update:', error);
      setUpdateDownloadError(
        error instanceof Error
          ? error.message
          : 'تعذر تنزيل التحديث. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      );
    } finally {
      setIsOpeningAppUpdate(false);
      setUpdateDownloadProgress(null);
    }
  };

  useEffect(() => {
    const language = userProfile.targetLanguage;
    if (!language) return;

    let isMounted = true;
    const cached = getCachedLearningPath(language);
    if (language === 'fr') {
      setLessons(cached ?? []);
      setContentLoading(!cached);
    } else {
      setLessons(cached ?? LEARNING_PATH_LESSONS);
      setContentLoading(!cached);
    }
    setSelectedLessonId(null);

    void fetchLatestLearningPath(language)
      .then((latestLessons) => {
        if (isMounted && latestLessons) setLessons(latestLessons);
      })
      .catch((error: unknown) => {
        console.warn(`Using locally cached ${language} Lin Go lesson content:`, error);
      })
      .finally(() => {
        if (isMounted) setContentLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userProfile.targetLanguage]);

  useEffect(() => {
    const handleSpeechUnavailable = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: unknown }>).detail;
      if (!detail || typeof detail.message !== 'string') return;

      setSpeechLoading(false);
      setSpeechProgress(null);
      setSpeechNotice(detail.message);
      if (speechNoticeTimeout.current) clearTimeout(speechNoticeTimeout.current);
      speechNoticeTimeout.current = setTimeout(() => setSpeechNotice(null), 7000);
    };
    const handleSpeechStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: unknown; progress?: unknown }>).detail;
      if (!detail || !['loading', 'playing', 'idle'].includes(String(detail.status))) return;
      const isLoading = detail.status === 'loading';
      setSpeechLoading(isLoading);
      setSpeechProgress(
        isLoading && typeof detail.progress === 'number'
          ? Math.max(0, Math.min(100, detail.progress))
          : null
      );
      if (isLoading) {
        setSpeechNotice(null);
        if (speechNoticeTimeout.current) clearTimeout(speechNoticeTimeout.current);
      }
    };

    window.addEventListener(SPEECH_UNAVAILABLE_EVENT, handleSpeechUnavailable);
    window.addEventListener(SPEECH_STATUS_EVENT, handleSpeechStatus);
    const lastUnavailableMessage = speechService.getLastUnavailableMessage();
    if (lastUnavailableMessage) {
      handleSpeechUnavailable(
        new CustomEvent(SPEECH_UNAVAILABLE_EVENT, {
          detail: { message: lastUnavailableMessage },
        })
      );
    }
    return () => {
      window.removeEventListener(SPEECH_UNAVAILABLE_EVENT, handleSpeechUnavailable);
      window.removeEventListener(SPEECH_STATUS_EVENT, handleSpeechStatus);
      if (speechNoticeTimeout.current) clearTimeout(speechNoticeTimeout.current);
    };
  }, []);

  useEffect(() => {
    setSelectedLessonId((current) =>
      current && lessons.some((lesson) => lesson.id === current)
        ? current
        : learningPath.nextLessonId,
    );
  }, [lessons, learningPath.nextLessonId]);

  const handleChangeTab = (tab: ActiveTab) => {
    if (placementGateOpen && tab !== 'categories') return;
    if (tab !== activeTab) speechService.stopSpeaking();
    setActiveTab(tab);
  };

  // Sync to local storage
  const handleUpdateProfile = useCallback((updated: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      saveProfile(next);
      return next;
    });
  }, []);

  const handleSelectLanguage = useCallback((language: TargetLanguage) => {
    const next = switchLearningLanguage(userProfile, language);
    saveProfile(next);
    setUserProfile(next);
    setPlacementGateOpen(!next.placementAssessment?.result);
    setActiveTab('categories');
  }, [userProfile]);

  const handleResetProgress = () => {
    localStorage.removeItem('englishtok_user_profile_v1');
    resetGameProgress();
    clearPreImportSnapshot();
    const fresh = getStoredProfile();
    setUserProfile(fresh);
    setPlacementGateOpen(!fresh.targetLanguage || !fresh.placementAssessment?.result);
  };

  const handleRestoreProgress = (
    profile: UserProfile,
    gameProgress?: GameProgress,
    options?: { createPreImportSnapshot?: boolean; sourceCreatedAt?: string },
  ) => {
    const previousProfile = userProfile;
    const previousGameProgress = loadGameProgress();

    if (options?.createPreImportSnapshot) {
      // This must succeed before any current data is replaced. If storage is
      // full, restore is blocked and the learner's progress stays untouched.
      savePreImportSnapshot(previousProfile, previousGameProgress, options.sourceCreatedAt);
    }

    if (!saveProfile(profile)) {
      throw new Error('تعذر حفظ التقدم المستورد في التخزين المحلي. لم يتم تغيير تقدمك الحالي.');
    }
    if (gameProgress && !saveGameProgress(gameProgress)) {
      saveProfile(previousProfile);
      throw new Error(
        'تعذر حفظ إنجازات الألعاب المستوردة. حاول إفراغ مساحة التخزين ثم أعد المحاولة؛ لم يتم اعتماد الاستيراد.',
      );
    }

    setUserProfile(profile);
    setPlacementGateOpen(!profile.targetLanguage || !profile.placementAssessment?.result);
  };

  const handleRetakePlacement = () => {
    if (!userProfile.targetLanguage) return;
    if (!window.confirm('سيُعاد اختيار نقطة البداية: يمكنك البدء من المرحلة الأولى أو إجراء اختبار المستوى من جديد. لن يُحذف XP أو سجل الدروس والاختبارات. هل تريد المتابعة؟')) return;
    handleUpdateProfile({ placementAssessment: undefined });
    setActiveTab('categories');
    setPlacementGateOpen(true);
  };

  const handleRefreshContent = async () => {
    const latestLessons = await fetchLatestLearningPath(userProfile.targetLanguage ?? 'en');
    if (!latestLessons) return false;
    setLessons(latestLessons);
    return true;
  };

  const handleSelectLessonFromCategories = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('lesson');
  }, []);

  return (
    <div className="app-shell min-h-0 text-slate-100 flex flex-col items-center justify-start overflow-hidden journey-shell">
      {speechNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-x-4 z-[100] mx-auto flex max-w-md items-start justify-between gap-3 rounded-2xl border border-amber-400/50 bg-slate-900 px-4 py-3 text-sm text-amber-100 shadow-2xl"
          style={{ top: notificationTop }}
        >
          <p dir="rtl">{speechNotice}</p>
          <button
            type="button"
            onClick={() => {
              if (speechNoticeTimeout.current) clearTimeout(speechNoticeTimeout.current);
              setSpeechNotice(null);
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800"
            aria-label="إغلاق رسالة الصوت"
          >
            إغلاق
          </button>
        </div>
      )}
      {speechLoading && !speechNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 z-[100] mx-auto w-fit rounded-full border border-[#315a7c]/60 bg-slate-900 px-4 py-2 text-sm text-[#dbe7f0] shadow-xl"
          style={{ top: notificationTop }}
          dir="rtl"
        >
          <span>
            {speechProgress === null
              ? `جارٍ تحميل وتهيئة الصوت ${userProfile.targetLanguage === 'fr' ? 'الفرنسي' : 'الإنجليزي'}…`
              : `جارٍ تنزيل الصوت: ${speechProgress}%`}
          </span>
          {speechProgress !== null && (
            <div
              className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-700"
              role="progressbar"
              aria-label="تقدم تنزيل نموذج النطق"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={speechProgress}
            >
              <div
                className="h-full rounded-full bg-[#3d7198] transition-[width] duration-150"
                style={{ width: `${speechProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      {contentLoading && !placementGateOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 z-[100] mx-auto w-fit rounded-full border border-[#315a7c]/60 bg-slate-900 px-4 py-2 text-sm text-[#dbe7f0] shadow-xl"
          style={{ top: notificationTop }}
          dir="rtl"
        >
          جارٍ تحميل دروس {userProfile.targetLanguage === 'fr' ? 'الفرنسية' : 'الإنجليزية'}…
        </div>
      )}
      {!IS_STORE_BUILD && availableAppUpdate && (
        <div
          role="status"
          className="fixed inset-x-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-emerald-400/40 bg-slate-900 px-4 py-3 text-sm text-emerald-100 shadow-2xl"
          style={{ top: notificationTop }}
          dir="rtl"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold">يتوفر تحديث جديد لـ Lin Go</p>
            <p className="mt-1 text-xs text-slate-300">
              الإصدار {availableAppUpdate.version}
              {availableAppUpdate.notes ? ` — ${availableAppUpdate.notes}` : ''}
            </p>
            {updateDownloadError && (
              <p role="alert" className="mt-2 text-xs text-rose-300">
                {updateDownloadError}
              </p>
            )}
            {updateOpenMessage && (
              <p role="status" className="mt-2 text-xs text-emerald-300">
                {updateOpenMessage}
              </p>
            )}
            <button
              type="button"
              onClick={handleOpenAppUpdate}
              disabled={isOpeningAppUpdate}
              className="mt-3 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
            >
              {isOpeningAppUpdate
                ? updateDownloadProgress !== null
                  ? `جارٍ تنزيل التحديث… ${updateDownloadProgress}%`
                  : 'جارٍ بدء التنزيل…'
                : 'تنزيل التحديث من التطبيق'}
            </button>
            {isOpeningAppUpdate && updateDownloadProgress !== null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
                  style={{ width: `${Math.max(4, updateDownloadProgress)}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-[10px] text-slate-400">
              سينزّل التطبيق حزمة APK الرسمية داخليًا، ثم يفتح مثبّت Android لتأكيد التثبيت.
              قد يطلب Android السماح بالتثبيت من هذا المصدر مرة واحدة، ويتحقق من التوقيع والتوافق قبل التثبيت.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAvailableAppUpdate(null);
              setUpdateDownloadError(null);
              setUpdateOpenMessage(null);
              setUpdateDownloadProgress(null);
            }}
            disabled={isOpeningAppUpdate}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
            aria-label="إغلاق إشعار التحديث"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Device wrapper: Sleek mobile mock container on wide screens if isPhoneFrameView is active, or full width on mobile/tablet */}
      <div
        className={`relative w-full h-full min-h-0 flex flex-col transition-all duration-300 journey-shell ${
          isPhoneFrameView
            ? 'max-w-[430px] sm:my-3 sm:rounded-[36px] sm:border-[5px] sm:border-slate-800 sm:shadow-2xl sm:overflow-hidden relative sm:max-h-[calc(100dvh-24px)]'
            : 'max-w-6xl'
        }`}
      >
        {/* Android / iPhone Mock Camera Notch in phone preview mode */}
        {isPhoneFrameView && (
          <div className="hidden sm:flex items-center justify-center pt-1.5 pb-0.5 bg-slate-950 z-50">
            <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
            </div>
          </div>
        )}

        {/* Top App Bar */}
        {activeTab !== 'lesson' && activeTab !== 'chat' && (
          <TopBar
            userProfile={userProfile}
            isPhoneFrameView={isPhoneFrameView}
            onToggleFrameView={() => setIsPhoneFrameView(!isPhoneFrameView)}
            onGoToProgress={() => handleChangeTab('progress')}
            onOpenAiTutor={() => handleChangeTab('chat')}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          {activeTab === 'categories' && (
            <CategoriesTab
              lessons={lessons}
              learningPath={learningPath}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onSelectLesson={handleSelectLessonFromCategories}
              isPhoneFrameView={isPhoneFrameView}
            />
          )}

          {activeTab === 'lesson' && (() => {
            const selectedLesson =
              lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
            return selectedLesson ? (
              <LessonSession
                key={selectedLesson.id}
                lesson={selectedLesson}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onBackToPath={() => setActiveTab('categories')}
              />
            ) : null;
          })()}

          {activeTab === 'vocab' && (
            <VocabTab
              lessons={lessons}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'games' && (
            <GamesTab
              lessons={lessons}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTab
              userProfile={userProfile}
              lessons={lessons}
              onUpdateProfile={handleUpdateProfile}
              onResumeLearning={() => {
                setSelectedLessonId(learningPath.nextLessonId);
                setActiveTab('categories');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              userProfile={userProfile}
              hasLessons={lessons.length > 0}
              onUpdateProfile={handleUpdateProfile}
              onRetakePlacement={handleRetakePlacement}
              onChangeTargetLanguage={handleSelectLanguage}
              onResetProgress={handleResetProgress}
              onRestoreProgress={handleRestoreProgress}
              onRefreshContent={handleRefreshContent}
            />
          )}

          {activeTab === 'chat' && (
            <ChatTab
              key={userProfile.targetLanguage ?? 'en'}
              lessons={lessons}
              userProfile={userProfile}
              onBack={() => handleChangeTab('categories')}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Tab Bar */}
        {activeTab !== 'lesson' && activeTab !== 'chat' && <BottomTabBar
          activeTab={activeTab}
          savedWordsCount={savedWordsCount}
          userStreak={userProfile.streakDays}
          onChangeTab={handleChangeTab}
        />}

      </div>
      {placementGateOpen && <PlacementAssessmentGate
        profile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onSelectLanguage={handleSelectLanguage}
        onContinue={() => setPlacementGateOpen(false)}
      />}
    </div>
  );
}
