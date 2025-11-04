// components/ChatWidget/ChatHeader.tsx
'use client';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon, ArrowLeftIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ModelSelector from './ModelSelector';
import { WidgetSize, Model } from './types';

interface ChatHeaderProps {
  size: WidgetSize;
  toggleSize: () => void;
  closeWidget: () => void;
  selectedModel: Model | null;
  models: Model[];
  selectModel: (model: Model | null) => void;
  goToSettings: () => void;
  onOpenFiles: () => void;
  isMobile: boolean;
  onReturnToHelpCenter?: () => void;
}

export default function ChatHeader({
  size,
  toggleSize,
  closeWidget,
  selectedModel,
  models,
  selectModel,
  goToSettings,
  onOpenFiles,
  isMobile,
  onReturnToHelpCenter,
}: ChatHeaderProps) {
  const getTooltipContent = () => {
    if (isMobile) {
      return size === 'half' ? 'Full Screen' : 'Shrink';
    }
    switch (size) {
      case 'initial':
        return 'Expand';
      case 'half':
        return 'Full Screen';
      case 'fullscreen':
        return 'Shrink';
      default:
        return 'Expand';
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-3 backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-t-2xl border-0">
      {/* Left side - Navigation and size controls */}
      <div className="flex items-center gap-2">
        {onReturnToHelpCenter && (
          <Tooltip content="Return to Help Center">
            <button
              onClick={onReturnToHelpCenter}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-0 hover:scale-110 active:scale-95 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
              aria-label="Return to help center"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        )}

        {/* Hide size toggle on mobile when return button is present */}
        <div className={onReturnToHelpCenter ? "hidden sm:flex items-center gap-2" : "flex items-center gap-2"}>
          <Tooltip variant="right" content={getTooltipContent()}>
            <button
              onClick={toggleSize}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-0 hover:scale-110 active:scale-95 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
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
      </div>

      {/* Center - Title with Model Icon and Name (clickable) */}
      <div className="flex-1 flex items-center justify-center mx-4">
        <ModelSelector
          selectedModel={selectedModel}
          models={models}
          selectModel={selectModel}
          goToSettings={goToSettings}
          onOpenFiles={onOpenFiles}
        />
      </div>

      {/* Right side - Close button */}
      <div className="flex items-center">
        <Tooltip content="Close">
          <button
            onClick={closeWidget}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-200 focus:outline-none focus:ring-0 hover:scale-110 active:scale-95"
            aria-label="Close chat widget"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}