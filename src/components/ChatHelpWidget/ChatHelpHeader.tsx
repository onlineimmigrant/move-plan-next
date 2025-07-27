// components/ChatHelpWidget/ChatHelpHeader.tsx
'use client';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ModernLanguageSwitcher from '@/components/ModernLanguageSwitcher';
import { WidgetSize } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';

interface ChatHelpHeaderProps {
  size: WidgetSize;
  toggleSize: () => void;
  closeWidget: () => void;
  isMobile: boolean;
  currentView?: 'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support';
  onLanguageChange?: (locale: string) => void;
}

export default function ChatHelpHeader({
  size,
  toggleSize,
  closeWidget,
  isMobile,
  currentView,
  onLanguageChange,
}: ChatHelpHeaderProps) {
  const { t } = useHelpCenterTranslations();
  
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'welcome':
        return t.helpCenter;
      case 'articles':
      case 'knowledge-base':
        return t.knowledgeBase;
      case 'faq':
        return t.faqs;
      case 'conversation':
      case 'live-support':
        return t.liveSupport;
      case 'ai':
        return t.aiAssistant;
      default:
        return t.helpCenter;
    }
  };
  const getTooltipContent = () => {
    if (isMobile) {
      return size === 'half' ? t.fullScreen : t.shrink;
    }
    switch (size) {
      case 'initial':
        return t.expand;
      case 'half':
        return t.fullScreen;
      case 'fullscreen':
        return t.shrink;
      default:
        return t.expand;
    }
  };

  return (
    <div className="flex justify-between items-center mb-2 bg-white/95 backdrop-blur-sm px-6 py-4 shadow-sm rounded-t-2xl border-b border-gray-100 relative z-[100]">
      <Tooltip variant="right" content={getTooltipContent()}>
        <button
          onClick={toggleSize}
          className="cursor-pointer text-sky-500 hover:text-sky-600 hover:bg-sky-50 p-2.5 rounded-full transition-all duration-300 ease-out hover:scale-105"
        >
          {size === 'fullscreen' ? (
            <ArrowsPointingInIcon className="h-5 w-5" />
          ) : (
            <ArrowsPointingOutIcon className="h-5 w-5" />
          )}
        </button>
      </Tooltip>
      
      <div className="flex items-center space-x-4">
        <h3 className="text-xl font-light text-gray-900 tracking-tight">{getHeaderTitle()}</h3>
        {/* Only show language switcher when not in initial window mode */}
        {size !== 'initial' && (
          <div className="scale-90 relative z-[200]">
            <ModernLanguageSwitcher 
              zIndex={9999} 
              onLanguageChange={onLanguageChange}
              preventNavigation={!!onLanguageChange}
            />
          </div>
        )}
      </div>
      
      <Tooltip content={t.close}>
        <button
          onClick={closeWidget}
          className="cursor-pointer text-sky-500 hover:text-sky-600 hover:bg-sky-50 p-2.5 rounded-full transition-all duration-300 ease-out hover:scale-105"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}
