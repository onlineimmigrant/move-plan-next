// components/ChatHelpWidget/ChatHelpHeader.tsx
'use client';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ModernLanguageSwitcher from '@/components/ModernLanguageSwitcher';
import { WidgetSize } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChatHelpHeaderProps {
  size: WidgetSize;
  toggleSize: () => void;
  closeWidget: () => void;
  isMobile: boolean;
  currentView?: 'welcome' | 'conversation' | 'articles' | 'ai' | 'faq' | 'knowledge-base' | 'live-support' | 'features';
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
  const themeColors = useThemeColors();
  
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'welcome':
        return t.helpCenter;
      case 'articles':
      case 'knowledge-base':
        return t.knowledgeBase;
      case 'faq':
        return t.faqs;
      case 'features':
        return t.features || 'Features';
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
    <div 
      className="flex justify-between items-center px-4 py-3 backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-t-2xl border-0"
    >
      {/* Left side - Size control (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip variant="right" content={getTooltipContent()}>
          <button
            onClick={toggleSize}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-0 hover:scale-110 active:scale-95"
            aria-label={getTooltipContent()}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = themeColors.cssVars.primary.hover;
              e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            {size === 'fullscreen' ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
      </div>
      
      {/* Mobile spacer */}
      <div className="sm:hidden w-8"></div>
      {/* Center - Title */}
      <div className="flex-1 flex items-center justify-center mx-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 sm:h-6 rounded-full" style={{ backgroundColor: themeColors.cssVars.primary.base }} />
          <h2 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200 tracking-tight">{getHeaderTitle()}</h2>
        </div>
      </div>
      
      {/* Right side - Close button */}
      <div className="flex items-center">
        <Tooltip content={t.close}>
          <button
            onClick={closeWidget}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-200 focus:outline-none focus:ring-0 hover:scale-110 active:scale-95"
            aria-label="Close help center"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
