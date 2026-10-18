/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, UserProfile } from './types';
import { INITIAL_LESSONS } from './data/lessons';
import { getStoredProfile, saveProfile } from './services/storageService';
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
          onGoToProgress={() => setActiveTab('progress')}
        />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {activeTab === 'feed' && (
            <FeedPlayer
              lessons={INITIAL_LESSONS}
              initialLessonId={selectedLessonId}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenCategories={() => setActiveTab('categories')}
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
          onChangeTab={setActiveTab}
        />
      </div>
    </div>
  );
}
