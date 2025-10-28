// ModalHeader.tsx - Header section for modals
'use client';

import React, { ReactNode } from 'react';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface ModalHeaderProps {
  title: string | ReactNode;
  subtitle?: string;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  className?: string;
  actions?: ReactNode;
  adminBadge?: boolean; // Whether to show admin badge after title
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  onToggleFullscreen,
  isFullscreen = false,
  showCloseButton = true,
  showFullscreenButton = false,
  className,
  actions,
  adminBadge = false,
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between p-6 border-b border-gray-200 bg-white',
      className
    )}>
      <div className="flex-1 flex items-center gap-2">
        {typeof title === 'string' ? (
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        ) : (
          <div className="text-xl">{title}</div>
        )}
        {subtitle && (
          <p className="hidden md:block text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {actions}
        
        {showFullscreenButton && onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
        )}
        
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
