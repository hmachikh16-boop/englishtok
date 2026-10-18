import React from 'react';
import { PlaySquare, Compass, BookOpen, Trophy, Settings, Flame } from 'lucide-react';
import { ActiveTab } from '../../types';
import { speechService } from '../../services/speechService';

interface BottomTabBarProps {
  activeTab: ActiveTab;
  savedWordsCount: number;
  userStreak: number;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  savedWordsCount,
  userStreak,
  onChangeTab,
}) => {
  const tabs = [
    {
      id: 'feed' as ActiveTab,
      labelAr: 'الرئيسية',
      icon: PlaySquare,
      badge: null,
    },
    {
      id: 'categories' as ActiveTab,
      labelAr: 'التصنيفات',
      icon: Compass,
      badge: null,
    },
    {
      id: 'vocab' as ActiveTab,
      labelAr: 'الكلمات',
      icon: BookOpen,
      badge: savedWordsCount > 0 ? savedWordsCount : null,
    },
    {
      id: 'progress' as ActiveTab,
      labelAr: 'التقدم',
      icon: Trophy,
      badge: userStreak > 0 ? userStreak : null,
    },
    {
      id: 'settings' as ActiveTab,
      labelAr: 'الإعدادات',
      icon: Settings,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    speechService.playPop();
    onChangeTab(tabId);
  };

  return (
    <nav
      className="relative z-40 w-full shrink-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 safe-area-pb"
      aria-label="التنقل الرئيسي"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5 items-center h-16 px-2 sm:px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="group relative flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 active:scale-95 transition-transform"
              aria-label={tab.labelAr}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-sky-400 stroke-[2.5]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {/* Badge if present */}
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-black flex items-center justify-center font-mono-num ${
                      tab.id === 'progress'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {tab.id === 'progress' ? (
                      <>
                        <Flame className="w-2.5 h-2.5 fill-current" />
                        {tab.badge}
                      </>
                    ) : (
                      tab.badge
                    )}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-bold tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.labelAr}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-sky-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
