import React from 'react';
import { Flame, Sparkles, Smartphone, Monitor } from 'lucide-react';
import { UserProfile } from '../../types';
import { speechService } from '../../services/speechService';

interface TopBarProps {
  userProfile: UserProfile;
  isPhoneFrameView: boolean;
  onToggleFrameView: () => void;
  onGoToProgress: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userProfile,
  isPhoneFrameView,
  onToggleFrameView,
  onGoToProgress,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 h-14 px-3 sm:px-4">
      <div className="max-w-xl mx-auto h-full flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-black tracking-tight text-white font-en whitespace-nowrap shrink-0 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>English<span className="text-sky-400">Tok</span></span>
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 border-r border-slate-700 pr-2">
            فيديوهات قصيرة للتعلم
          </span>
        </div>

        {/* Zone 2: Streak & XP Metrics (Interactive button leading to progress) */}
        <button
          onClick={() => {
            speechService.playPop();
            onGoToProgress();
          }}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          {/* XP */}
          <div className="flex items-center gap-1 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono-num">{userProfile.xp}</span>
            <span className="text-[10px] text-slate-400">XP</span>
          </div>

          <span className="text-slate-600">·</span>

          {/* Streak */}
          <div className="flex items-center gap-1 text-rose-400">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono-num">{userProfile.streakDays}</span>
            <span className="text-[10px] text-slate-400">يوم</span>
          </div>
        </button>

        {/* Zone 3: Device Frame Mode Toggle (Smartphone vs Tablet/Wide) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              speechService.playPop();
              onToggleFrameView();
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition-all"
            title={isPhoneFrameView ? 'عرض الشاشة الكاملة للتابلت' : 'عرض محاكي شاشة الهاتف'}
          >
            {isPhoneFrameView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>شاشة التابلت</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>إطار الهاتف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
