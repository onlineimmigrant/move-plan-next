// components/ChatHelpWidget/ChatHelpTabs.tsx
'use client';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  RocketLaunchIcon 
} from '@heroicons/react/24/outline';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChatHelpTabsProps {
  activeTab: 'welcome' | 'conversation' | 'ai';
  onTabChange: (tab: 'welcome' | 'conversation' | 'ai') => void;
  isAuthenticated: boolean;
  isFullPage?: boolean;
}

export default function ChatHelpTabs({
  activeTab,
  onTabChange,
  isAuthenticated,
  isFullPage = false,
}: ChatHelpTabsProps) {
  const { t } = useHelpCenterTranslations();
  const themeColors = useThemeColors();
  
  const tabs = [
    {
      id: 'welcome' as const,
      name: 'Explore',
      icon: HomeIcon,
    },
    {
      id: 'conversation' as const,
      name: 'Chat',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: 'ai' as const,
      name: t.aiAssistant,
      icon: RocketLaunchIcon,
    },
  ];

  return (
    <div className="flex justify-center px-4 pt-3 pb-1">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 shadow-sm hover:shadow-md"
              style={{
                backgroundColor: isActive ? themeColors.cssVars.primary.base : 'white',
                color: isActive ? 'white' : themeColors.cssVars.primary.base,
                border: `1.5px solid ${isActive ? themeColors.cssVars.primary.base : themeColors.cssVars.primary.light}40`,
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

