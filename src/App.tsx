/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { AtSign, Phone } from 'lucide-react';
import { ActiveTab, Lesson, UserProfile } from './types';
import { LEARNING_PATH_LESSONS } from './data/curriculum';
import { getLearningPathState } from './services/learningPath';
import { getStoredProfile, saveProfile } from './services/storageService';
import { fetchLatestLearningPath, getCachedLearningPath } from './services/contentService';
import { checkForAppUpdate, type AppUpdateManifest } from './services/appUpdateService';
import {
  SPEECH_STATUS_EVENT,
  SPEECH_UNAVAILABLE_EVENT,
  speechService,
} from './services/speechService';
import { TopBar } from './components/navigation/TopBar';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { CategoriesTab } from './components/categories/CategoriesTab';
import { VocabTab } from './components/vocab/VocabTab';
import { ProgressTab } from './components/progress/ProgressTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { LessonSession } from './components/learning/LessonSession';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getStoredProfile());
  const [lessons, setLessons] = useState<Lesson[]>(
    () => getCachedLearningPath() ?? LEARNING_PATH_LESSONS,
  );
  const learningPath = getLearningPathState(lessons, userProfile);
  const [activeTab, setActiveTab] = useState<ActiveTab>('categories');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(learningPath.nextLessonId);
  const [isPhoneFrameView, setIsPhoneFrameView] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [speechProgress, setSpeechProgress] = useState<number | null>(null);
  const speechNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [availableAppUpdate, setAvailableAppUpdate] = useState<AppUpdateManifest | null>(null);
  const [updateDownloadError, setUpdateDownloadError] = useState<string | null>(null);
  const notificationTop = activeTab === 'lesson'
    ? 'calc(env(safe-area-inset-top, 0px) + 12px)'
    : isPhoneFrameView
      ? 'calc(env(safe-area-inset-top, 0px) + 112px)'
      : 'calc(env(safe-area-inset-top, 0px) + 74px)';

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let isMounted = true;
    void CapacitorApp.getInfo()
      .then(({ version }) => checkForAppUpdate(version))
      .then((update) => {
        if (isMounted && update) setAvailableAppUpdate(update);
      })
      .catch((error: unknown) => {
        console.warn('Unable to check for EnglishTok updates on launch:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadAppUpdate = async () => {
    if (!availableAppUpdate) return;
    setUpdateDownloadError(null);
    try {
      await Browser.open({ url: availableAppUpdate.apkUrl });
    } catch (error) {
      console.error('Failed to open the Android update download:', error);
      setUpdateDownloadError('تعذر فتح تنزيل التحديث. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    void fetchLatestLearningPath()
      .then((latestLessons) => {
        if (isMounted && latestLessons) setLessons(latestLessons);
      })
      .catch((error: unknown) => {
        console.warn('Using locally cached EnglishTok lesson content:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleChangeTab = (tab: ActiveTab) => {
    if (tab !== activeTab) speechService.stopSpeaking();
    setActiveTab(tab);
  };

  // Sync to local storage
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      saveProfile(next);
      return next;
    });
  };

  const handleResetProgress = () => {
    localStorage.removeItem('englishtok_user_profile_v1');
    const fresh = getStoredProfile();
    setUserProfile(fresh);
  };

  const handleRefreshContent = async () => {
    const latestLessons = await fetchLatestLearningPath();
    if (!latestLessons) return false;
    setLessons(latestLessons);
    return true;
  };

  const handleSelectLessonFromCategories = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('lesson');
  };

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
          className="fixed inset-x-4 z-[100] mx-auto w-fit rounded-full border border-sky-400/40 bg-slate-900 px-4 py-2 text-sm text-sky-100 shadow-xl"
          style={{ top: notificationTop }}
          dir="rtl"
        >
          <span>
            {speechProgress === null
              ? 'جارٍ تحميل وتهيئة نموذج النطق الإنجليزي…'
              : `جارٍ تنزيل نموذج النطق: ${speechProgress}%`}
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
                className="h-full rounded-full bg-sky-400 transition-[width] duration-150"
                style={{ width: `${speechProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      {availableAppUpdate && (
        <div
          role="status"
          className="fixed inset-x-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-emerald-400/40 bg-slate-900 px-4 py-3 text-sm text-emerald-100 shadow-2xl"
          style={{ top: notificationTop }}
          dir="rtl"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold">يتوفر تحديث جديد لـ EnglishTok</p>
            <p className="mt-1 text-xs text-slate-300">
              الإصدار {availableAppUpdate.version}
              {availableAppUpdate.notes ? ` — ${availableAppUpdate.notes}` : ''}
            </p>
            {updateDownloadError && (
              <p role="alert" className="mt-2 text-xs text-rose-300">
                {updateDownloadError}
              </p>
            )}
            <button
              type="button"
              onClick={handleDownloadAppUpdate}
              className="mt-3 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
            >
              تنزيل التحديث
            </button>
            <p className="mt-2 text-[10px] text-slate-400">
              سيتحقق Android من التوافق والتوقيع، ويطلب موافقتك قبل التثبيت.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAvailableAppUpdate(null)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800"
            aria-label="إغلاق إشعار التحديث"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Device wrapper: Sleek mobile mock container on wide screens if isPhoneFrameView is active, or full width on mobile/tablet */}
      <div
        className={`w-full h-full min-h-0 flex flex-col transition-all duration-300 journey-shell ${
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
        {activeTab !== 'lesson' && (
          <TopBar
            userProfile={userProfile}
            isPhoneFrameView={isPhoneFrameView}
            onToggleFrameView={() => setIsPhoneFrameView(!isPhoneFrameView)}
            onGoToProgress={() => handleChangeTab('progress')}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          {activeTab === 'categories' && (
            <CategoriesTab
              lessons={lessons}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onSelectLesson={handleSelectLessonFromCategories}
              isPhoneFrameView={isPhoneFrameView}
            />
          )}

          {activeTab === 'lesson' && (
            <LessonSession
              key={selectedLessonId}
              lesson={lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0]}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onBackToPath={() => setActiveTab('categories')}
            />
          )}

          {activeTab === 'vocab' && (
            <VocabTab
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
              onUpdateProfile={handleUpdateProfile}
              onResetProgress={handleResetProgress}
              onRefreshContent={handleRefreshContent}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Tab Bar */}
        {activeTab !== 'lesson' && <BottomTabBar
          activeTab={activeTab}
          savedWordsCount={userProfile.savedWordIds.length}
          userStreak={userProfile.streakDays}
          onChangeTab={handleChangeTab}
        />}
        {activeTab !== 'lesson' && <footer
          className="journey-footer shrink-0 border-t px-3 py-2 text-center"
          dir="rtl"
        >
          <p className="text-[10px] font-bold text-slate-400 sm:text-xs">
            تطوير وبرمجة: <span className="text-sky-300">حمادوش الشيخ</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-slate-400 sm:text-xs">
            <a
              href="mailto:hmachikh16@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-md hover:text-sky-300 focus-visible:text-sky-300"
              dir="ltr"
            >
              <AtSign className="h-3 w-3" aria-hidden="true" />
              hmachikh16@gmail.com
            </a>
            <a
              href="tel:+213665003037"
              className="inline-flex items-center gap-1.5 rounded-md hover:text-sky-300 focus-visible:text-sky-300"
              dir="ltr"
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              0665003037
            </a>
          </div>
        </footer>}
      </div>
    </div>
  );
}
