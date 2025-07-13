// components/ChatWidget/ChatHeader.tsx
'use client';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ModelSelector from './ModelSelector';
import { Model, WidgetSize } from './types';

interface ChatHeaderProps {
  size: WidgetSize;
  toggleSize: () => void;
  closeWidget: () => void;
  selectedModel: Model | null;
  models: Model[];
  selectModel: (model: Model | null) => void;
  goToSettings: () => void;
  isMobile: boolean;
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
    <div className="flex justify-between items-center mb-2 bg-gray-50 px-4 shadow rounded-t-lg">
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
      <div className="flex items-center space-x-2">
        <ModelSelector
          selectedModel={selectedModel}
          models={models}
          selectModel={selectModel}
          goToSettings={goToSettings}
        />
      </div>
      <Tooltip content="Close">
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