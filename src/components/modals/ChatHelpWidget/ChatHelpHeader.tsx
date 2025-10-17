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
    <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-2xl shadow-sm">
      {/* Left side - Size control */}
      <div className="flex items-center gap-2">
        <Tooltip variant="right" content={getTooltipContent()}>
          <button
            onClick={toggleSize}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label={getTooltipContent()}
          >
            {size === 'fullscreen' ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
      </div>
      
      {/* Center - Title and Language Switcher */}
      <div className="flex-1 flex flex-col items-center justify-center mx-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">{getHeaderTitle()}</h2>
        {/* Only show language switcher when not in initial window mode and not in conversation/live-support view */}
        {size !== 'initial' && currentView !== 'conversation' && currentView !== 'live-support' && (
          <div className="scale-75 relative z-[200]">
            <ModernLanguageSwitcher 
              zIndex={9999} 
              onLanguageChange={onLanguageChange}
              preventNavigation={!!onLanguageChange}
            />
          </div>
        )}
      </div>
      
      {/* Right side - Close button */}
      <div className="flex items-center">
        <Tooltip content={t.close}>
          <button
            onClick={closeWidget}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            aria-label="Close help center"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
