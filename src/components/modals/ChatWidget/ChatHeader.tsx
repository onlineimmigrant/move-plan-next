// components/ChatWidget/ChatHeader.tsx
'use client';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
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
    <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-xl shadow-sm">
      {/* Left side - Navigation and size controls */}
      <div className="flex items-center gap-2">
        {onReturnToHelpCenter && (
          <Tooltip content="Return to Help Center">
            <button
              onClick={onReturnToHelpCenter}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Return to help center"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        )}

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

      {/* Center - Title and Model selector */}
      <div className="flex-1 flex flex-col items-center justify-center mx-4">
        <h2 id="chat-widget-title" className="text-sm font-semibold text-slate-700 mb-1">
          AI Assistant
        </h2>
        <ModelSelector
          selectedModel={selectedModel}
          models={models}
          selectModel={selectModel}
          goToSettings={goToSettings}
        />
      </div>

      {/* Right side - Close button */}
      <div className="flex items-center">
        <Tooltip content="Close">
          <button
            onClick={closeWidget}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            aria-label="Close chat widget"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}