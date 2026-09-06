import React from 'react';
import { PenLine, Activity, GitCommit } from 'lucide-react';

export type AppTab = 'reflect' | 'insights' | 'memories';

interface BottomNavProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  memoriesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  memoriesCount = 0
}) => {
  const tabs: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'reflect', label: 'Reflect', icon: PenLine },
    { id: 'insights', label: 'Insights', icon: Activity },
    { id: 'memories', label: 'Memories', icon: GitCommit },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-xl border border-[#E8E4DF] shadow-xl shadow-black/8 rounded-full p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 select-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1A1A] hover:bg-[#F0EEEA]/70'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF6321]' : 'text-[#8C8781]'}`} />
            <span className="font-medium tracking-tight">{tab.label}</span>
            {tab.id === 'memories' && memoriesCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F0EEEA] text-[#8C8781]'
                }`}
              >
                {memoriesCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
