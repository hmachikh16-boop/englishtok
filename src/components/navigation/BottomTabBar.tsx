import React from 'react';
import { BookOpen, ChartNoAxesColumnIncreasing, Flame, Map, Settings2 } from 'lucide-react';
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
      id: 'categories' as ActiveTab,
      labelAr: 'المسار',
      icon: Map,
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
      icon: ChartNoAxesColumnIncreasing,
      badge: userStreak > 0 ? userStreak : null,
    },
    {
      id: 'settings' as ActiveTab,
      labelAr: 'الإعدادات',
      icon: Settings2,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    speechService.playPop();
    onChangeTab(tabId);
  };

  return (
    <nav
      className="journey-nav relative z-40 w-full shrink-0 backdrop-blur-md border-t safe-area-pb"
      aria-label="التنقل الرئيسي"
    >
      <div className="mx-auto grid h-[68px] w-full max-w-2xl grid-cols-4 items-center px-2 sm:px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`journey-tab group relative flex min-h-[54px] min-w-[54px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition-all active:scale-95 ${isActive ? 'is-active' : ''}`}
              aria-label={tab.badge ? `${tab.labelAr}، ${tab.badge > 99 ? '99+' : tab.badge}${tab.id === 'progress' ? ' يوم' : ' كلمة محفوظة'}` : tab.labelAr}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative grid h-7 w-7 place-items-center">
                <Icon className="journey-nav-icon h-[23px] w-[23px] transition-transform" strokeWidth={isActive ? 2.5 : 2.1} aria-hidden="true" />

                {/* Badge if present */}
                {tab.badge && (
                  <span
                    className={`absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 font-mono-num text-[9px] font-black ring-2 ring-white ${
                      tab.id === 'progress' ? 'bg-amber-400 text-amber-950' : 'bg-teal-700 text-white'
                    }`}
                  >
                    {tab.id === 'progress' ? (
                      <>
                        <Flame className="mr-0.5 h-2.5 w-2.5 fill-current" aria-hidden="true" />
                      {tab.badge > 99 ? '99+' : tab.badge}
                      </>
                    ) : (
                      tab.badge
                    )}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-bold tracking-tight transition-colors ${
                  isActive ? 'text-teal-800' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              >
                {tab.labelAr}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <span className="sr-only">الصفحة الحالية</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
