// components/ChatHelpWidget/ChatHelpTabs.tsx
'use client';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  RocketLaunchIcon 
} from '@heroicons/react/24/outline';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';

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
  
  const tabs = [
    {
      id: 'welcome' as const,
      name: t.welcome,
      icon: HomeIcon,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },
    {
      id: 'conversation' as const,
      name: t.liveSupport,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },

    {
      id: 'ai' as const,
      name: t.aiAssistant,
      icon: RocketLaunchIcon,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },
  ];

  return (
    <div className={`flex border-t border-gray-200 bg-white rounded-b-lg overflow-hidden ${isFullPage ? 'mb-8' : ''}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-all duration-200 ${
              isActive
                ? `${tab.color} ${tab.bgColor} border-t-2 ${tab.borderColor}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}
