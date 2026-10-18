/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActiveTab, UserProfile } from './types';
import { INITIAL_LESSONS } from './data/lessons';
import { getStoredProfile, saveProfile } from './services/storageService';
import {
  SPEECH_STATUS_EVENT,
  SPEECH_UNAVAILABLE_EVENT,
  speechService,
} from './services/speechService';
import { TopBar } from './components/navigation/TopBar';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { FeedPlayer } from './components/video/FeedPlayer';
import { CategoriesTab } from './components/categories/CategoriesTab';
import { VocabTab } from './components/vocab/VocabTab';
import { ProgressTab } from './components/progress/ProgressTab';
import { SettingsTab } from './components/settings/SettingsTab';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getStoredProfile());
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(INITIAL_LESSONS[0].id);
  const [isPhoneFrameView, setIsPhoneFrameView] = useState<boolean>(true);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [speechProgress, setSpeechProgress] = useState<number | null>(null);
  const speechNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSelectLessonFromCategories = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('feed');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start overflow-hidden">
      {speechNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-md items-start justify-between gap-3 rounded-2xl border border-amber-400/50 bg-slate-900 px-4 py-3 text-sm text-amber-100 shadow-2xl"
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
          className="fixed inset-x-4 top-4 z-[100] mx-auto w-fit rounded-full border border-sky-400/40 bg-slate-900 px-4 py-2 text-sm text-sky-100 shadow-xl"
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

      {/* Device wrapper: Sleek mobile mock container on wide screens if isPhoneFrameView is active, or full width on mobile/tablet */}
      <div
        className={`w-full h-full min-h-screen flex flex-col bg-slate-950 transition-all duration-300 ${
          isPhoneFrameView
            ? 'max-w-[430px] sm:my-3 sm:rounded-[36px] sm:border-[5px] sm:border-slate-800 sm:shadow-2xl sm:overflow-hidden relative sm:min-h-[844px] sm:max-h-[890px]'
            : 'max-w-4xl'
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
        <TopBar
          userProfile={userProfile}
          isPhoneFrameView={isPhoneFrameView}
          onToggleFrameView={() => setIsPhoneFrameView(!isPhoneFrameView)}
          onGoToProgress={() => handleChangeTab('progress')}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 pb-[calc(4rem+env(safe-area-inset-bottom))] relative overflow-hidden flex flex-col">
          {activeTab === 'feed' && (
            <FeedPlayer
              lessons={INITIAL_LESSONS}
              initialLessonId={selectedLessonId}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenCategories={() => handleChangeTab('categories')}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              lessons={INITIAL_LESSONS}
              onSelectLesson={handleSelectLessonFromCategories}
            />
          )}

          {activeTab === 'vocab' && (
            <VocabTab
              lessons={INITIAL_LESSONS}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTab
              userProfile={userProfile}
              lessons={INITIAL_LESSONS}
              onResumeLearning={() => setActiveTab('feed')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onResetProgress={handleResetProgress}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Tab Bar */}
        <BottomTabBar
          activeTab={activeTab}
          savedWordsCount={userProfile.savedWordIds.length}
          userStreak={userProfile.streakDays}
          onChangeTab={handleChangeTab}
        />
      </div>
    </div>
  );
}
