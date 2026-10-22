import React from 'react';
import { BookOpen, Flame, Gem, Smartphone, Monitor, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';
import { speechService } from '../../services/speechService';
import { getUserRank } from '../../services/storageService';

interface TopBarProps {
  userProfile: UserProfile;
  isPhoneFrameView: boolean;
  onToggleFrameView: () => void;
  onGoToProgress: () => void;
  onOpenAiTutor: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userProfile,
  isPhoneFrameView,
  onToggleFrameView,
  onGoToProgress,
  onOpenAiTutor,
}) => {
  const rank = getUserRank(userProfile.xp);
  const isFrench = userProfile.settings.voiceLanguage === 'fr';
  const languageFlag = isFrench ? '🇫🇷' : '🇺🇸';
  return (
    <header
      dir="ltr"
      className={`journey-topbar sticky top-0 z-30 w-full border-b px-3 sm:px-5 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}
    >
      <div className="mx-auto flex h-[66px] w-full max-w-6xl items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="journey-brand-name flex shrink-0 items-center gap-2 whitespace-nowrap font-en text-base font-extrabold tracking-tight text-slate-800 sm:text-lg">
            <span className="brand-mark journey-brand-mark"><BookOpen className="h-4 w-4" strokeWidth={2.8} /></span>
            <span>English<span className="journey-brand-accent">Tok</span></span>
          </span>
          <span className="journey-topbar-tagline hidden border-r border-emerald-100 pr-3 text-xs font-semibold text-slate-500 lg:inline-block">
            رحلتك اليومية لتعلّم الإنجليزية
          </span>
        </div>

        {/* Zone 2: Streak & XP Metrics (Interactive button leading to progress) */}
        <button
          onClick={() => {
            speechService.playPop();
            onGoToProgress();
          }}
          className="journey-stats flex shrink-0 items-center gap-1 rounded-2xl px-1.5 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-[.98] sm:gap-2 sm:px-2"
          dir="rtl"
        >
          <div className="topbar-metric topbar-language" title={isFrench ? 'النطق الفرنسي' : 'النطق الإنجليزي'}>
            <span aria-hidden="true">{languageFlag}</span><span className="topbar-language-code hidden sm:inline">{isFrench ? 'FR' : 'EN'}</span>
          </div>
          <span className="topbar-divider" aria-hidden="true" />
          <div className="topbar-metric topbar-rank hidden sm:flex">
            <ShieldCheck className="h-[17px] w-[17px]" strokeWidth={2.3} />
            <span className="max-w-24 truncate">{rank.titleAr}</span>
          </div>
          <span className="topbar-divider hidden sm:block" aria-hidden="true" />
          <div className="topbar-metric topbar-xp flex">
            <Gem className="h-[17px] w-[17px]" strokeWidth={2.3} />
            <span className="font-mono-num">{userProfile.xp}</span>
            <span className="topbar-unit">XP</span>
          </div>
          <span className="topbar-divider" aria-hidden="true" />
          <div className="topbar-metric topbar-streak flex">
            <Flame className="h-[17px] w-[17px]" strokeWidth={2.3} />
            <span className="font-mono-num">{userProfile.streakDays}</span>
            <span className="topbar-unit hidden sm:inline">يوم</span>
          </div>
        </button>

        {/* Zone 3: AI tutor entry + device frame mode toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              speechService.playPop();
              onOpenAiTutor();
            }}
            className="ai-topbar-entry group"
            aria-label="افتح المعلم الذكي للمحادثة والتصحيح"
            title="المعلم الذكي — محادثة وتصحيح ونطق"
          >
            <span className="ai-topbar-mark" aria-hidden="true">
              <Sparkles className="ai-topbar-sparkle" strokeWidth={2.35} />
              <span className="ai-topbar-mini">AI</span>
              <span className="ai-topbar-live" />
            </span>
            <span className="ai-topbar-copy" dir="rtl">
              <span className="ai-topbar-title">المعلم الذكي</span>
              <span className="ai-topbar-subtitle">AI TUTOR</span>
            </span>
          </button>

          <button
            onClick={() => {
              speechService.playPop();
              onToggleFrameView();
            }}
            className={`journey-frame-toggle ${isPhoneFrameView ? 'is-phone-frame-toggle' : 'hidden md:flex'} items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-teal-200 hover:text-teal-800 active:scale-95`}
            title={isPhoneFrameView ? 'عرض الشاشة الكاملة للتابلت' : 'عرض محاكي شاشة الهاتف'}
            aria-label={isPhoneFrameView ? 'عرض الشاشة الكاملة للتابلت' : 'عرض محاكي شاشة الهاتف'}
          >
            {isPhoneFrameView ? (
              <>
                <Monitor className="h-4 w-4 text-teal-700" strokeWidth={2.2} />
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 text-teal-700" strokeWidth={2.2} />
                <span>إطار الهاتف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
