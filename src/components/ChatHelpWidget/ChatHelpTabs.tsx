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
      name: 'Browse',
      icon: HomeIcon,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },
    {
      id: 'conversation' as const,
      name: 'Live Chat',
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
    <div className="flex justify-center px-2">
      <div className="relative bg-white/80 backdrop-blur-2xl p-1 sm:p-1.5 rounded-2xl border border-gray-200/50 w-full max-w-2xl">
        {/* Background slider */}
        <div 
          className={`absolute top-1 sm:top-1.5 h-[calc(100%-8px)] sm:h-[calc(100%-12px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
            activeTab === 'welcome' 
              ? 'left-1 sm:left-1.5 w-[calc(33.333%-4px)] sm:w-[calc(33.333%-6px)]' 
              : activeTab === 'conversation'
              ? 'left-[calc(33.333%+1px)] sm:left-[calc(33.333%+1.5px)] w-[calc(33.333%-4px)] sm:w-[calc(33.333%-6px)]'
              : 'left-[calc(66.666%+1px)] sm:left-[calc(66.666%+1.5px)] w-[calc(33.333%-4px)] sm:w-[calc(33.333%-6px)]'
          }`}
        />
        
        <div className="relative flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-[15px] font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
