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
}

export default function ChatHelpHeader({
  size,
  toggleSize,
  closeWidget,
  isMobile,
}: ChatHelpHeaderProps) {
  const { t } = useHelpCenterTranslations();
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
    <div className="flex justify-between items-center mb-2 bg-sky-50 px-4 py-3 shadow rounded-t-lg border-b border-sky-100 relative z-[100]">
      <Tooltip variant="right" content={getTooltipContent()}>
        <button
          onClick={toggleSize}
          className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
        >
          {size === 'fullscreen' ? (
            <ArrowsPointingInIcon className="h-5 w-5" />
          ) : (
            <ArrowsPointingOutIcon className="h-5 w-5" />
          )}
        </button>
      </Tooltip>
      
      <div className="flex items-center space-x-3">
        <h3 className="text-lg font-semibold text-sky-800">{t.helpCenter}</h3>
        {/* Only show language switcher when not in initial window mode */}
        {size !== 'initial' && (
          <div className="scale-90 relative z-[200]">
            <ModernLanguageSwitcher zIndex={9999} />
          </div>
        )}
      </div>
      
      <Tooltip content={t.close}>
        <button
          onClick={closeWidget}
          className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}
