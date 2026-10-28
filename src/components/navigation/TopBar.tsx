import React from 'react';
import { BookOpen, Crown, Flame, Gem, Smartphone, Monitor, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';
import { speechService } from '../../services/speechService';
import { getUserRank } from '../../services/storageService';
import { IS_GOLD_EDITION } from '../../config/edition';
import { IS_STORE_BUILD } from '../../config/storeBuild';
import { openGoldPage } from '../../services/goldLauncher';

interface TopBarProps {
  userProfile: UserProfile;
  isPhoneFrameView: boolean;
  onToggleFrameView: () => void;
  onGoToProgress: () => void;
  onOpenAiTutor: () => void;
  /** Lets the interactive Gold preview render the Gold identity in a normal web build. */
  goldEdition?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  userProfile,
  isPhoneFrameView,
  onToggleFrameView,
  onGoToProgress,
  onOpenAiTutor,
  goldEdition = IS_GOLD_EDITION,
}) => {
  const rank = getUserRank(userProfile.xp);
  const isFrench = userProfile.targetLanguage === 'fr';
  const languageNameAr = isFrench ? 'الفرنسية' : 'الإنجليزية';
  return (
    <header
      dir="ltr"
      className={`journey-topbar sticky top-0 z-30 w-full border-b px-3 sm:px-5 ${isPhoneFrameView ? 'is-phone-frame' : ''}`}
    >
      <div className="mx-auto flex h-[66px] w-full max-w-6xl items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span
            className="journey-brand-name flex shrink-0 items-center gap-1.5 whitespace-nowrap font-en text-base font-extrabold tracking-tight text-slate-800 sm:gap-2 sm:text-lg"
            aria-label={goldEdition ? 'Lin Go Gold' : 'Lin Go'}
          >
            <span className="brand-mark journey-brand-mark"><BookOpen className="h-4 w-4" strokeWidth={2.8} /></span>
            <span>Lin<span className="journey-brand-accent"> Go</span></span>
            {goldEdition && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300/80 bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-300 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-amber-950 shadow-sm">
                <Crown className="h-2.5 w-2.5" strokeWidth={2.8} aria-hidden="true" />
                Gold
              </span>
            )}
          </span>
          <span className="journey-topbar-tagline hidden border-r border-emerald-100 pr-3 text-xs font-semibold text-slate-500 lg:inline-block">
            رحلتك اليومية لتعلّم {languageNameAr}
          </span>
        </div>

        {/* Zone 2: Streak & XP Metrics (Interactive button leading to progress) */}
        <button
          type="button"
          onClick={() => {
            speechService.playPop();
            onGoToProgress();
          }}
          className="journey-stats flex shrink-0 items-center rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-[.98]"
          aria-label={`تقدمك: ${userProfile.xp} نقطة، سلسلة ${userProfile.streakDays} يوم، لغة ${languageNameAr}`}
          title={`${rank.titleAr} • ${userProfile.xp} XP • ${userProfile.streakDays} يوم • ${languageNameAr}`}
          dir="rtl"
        >
          <div className="topbar-metric topbar-language" title={`لغة التعلّم: ${languageNameAr}`}>
            <span className="topbar-language-badge" dir="ltr" aria-hidden="true">
              {isFrench ? 'FR' : 'EN'}
            </span>
            <span className="topbar-language-name hidden xl:inline">{languageNameAr}</span>
          </div>
          <span className="topbar-divider" aria-hidden="true" />
          <div className="topbar-metric topbar-xp">
            <span className="topbar-icon topbar-icon-xp" aria-hidden="true">
              <Gem strokeWidth={2.5} />
            </span>
            <span className="topbar-value font-mono-num">{userProfile.xp}</span>
            <span className="topbar-unit hidden sm:inline">XP</span>
          </div>
          <span className="topbar-divider" aria-hidden="true" />
          <div className="topbar-metric topbar-streak">
            <span className="topbar-icon topbar-icon-streak" aria-hidden="true">
              <Flame strokeWidth={2.5} />
            </span>
            <span className="topbar-value font-mono-num">{userProfile.streakDays}</span>
            <span className="topbar-unit hidden sm:inline">يوم</span>
          </div>
          <span className="topbar-divider hidden lg:block" aria-hidden="true" />
          <div className="topbar-metric topbar-rank hidden lg:flex">
            <span className="topbar-icon topbar-icon-rank" aria-hidden="true">
              <ShieldCheck strokeWidth={2.4} />
            </span>
            <span className="max-w-24 truncate">{rank.titleAr}</span>
          </div>
        </button>

        {/* Zone 3: Gold entry (free edition) + AI tutor + device frame mode toggle */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!goldEdition && !IS_STORE_BUILD && (
            <button
              type="button"
              onClick={() => {
                speechService.playPop();
                void openGoldPage();
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-300 px-1.5 py-1.5 text-[9px] font-black uppercase tracking-[0.06em] text-amber-950 shadow-sm transition-all hover:brightness-105 active:scale-95 sm:px-2 sm:text-[10px]"
              aria-label="اكتشف Lin Go Gold — النسخة المميزة"
              title="Lin Go Gold — نسخة مستقلة بأربعة مشاريع تطبيقية"
            >
              <Crown className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
              <span>Gold</span>
            </button>
          )}

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
