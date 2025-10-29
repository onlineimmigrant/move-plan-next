/**
 * AI Notification Component
 * Success/error/info notification banner with auto-dismiss
 */

'use client';

import React, { useEffect } from 'react';
import { AINotificationProps } from '../types';
import { AIIcons } from './AIIcons';

export const AINotification: React.FC<AINotificationProps> = ({
  message,
  type = 'success',
  onClose,
  autoDismissDelay = 5000,
  className = ""
}) => {
  // Auto-dismiss after delay
  useEffect(() => {
    if (autoDismissDelay && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismissDelay, onClose]);

  // Type-specific styling
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <AIIcons.Check className="w-5 h-5 text-green-500" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AIIcons.AlertCircle className="w-5 h-5 text-red-500" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <AIIcons.Info className="w-5 h-5 text-blue-500" />
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AIIcons.AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  };

  const style = styles[type];

  return (
    <div
      className={`
        ${style.bg} ${style.border} ${style.text}
        border rounded-lg p-4 mb-6
        flex items-start justify-between
        animate-[slideDown_0.3s_ease-out]
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start space-x-3 flex-1">
        {style.icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Dismiss notification"
        >
          <AIIcons.X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Animation keyframes (add to your global CSS)
export const notificationStyles = `
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
