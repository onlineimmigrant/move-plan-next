/**
 * ErrorState Component
 * 
 * Error display for modal content
 */

'use client';

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  
  /** Error message */
  message: string;
  
  /** Optional retry handler */
  onRetry?: () => void;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Custom className */
  className?: string;
}

const sizeStyles = {
  sm: {
    icon: 'w-10 h-10',
    iconContainer: 'w-12 h-12',
    iconInner: 'w-5 h-5',
    title: 'text-base',
    message: 'text-sm',
  },
  md: {
    icon: 'w-12 h-12',
    iconContainer: 'w-16 h-16',
    iconInner: 'w-6 h-6',
    title: 'text-lg',
    message: 'text-base',
  },
  lg: {
    icon: 'w-16 h-16',
    iconContainer: 'w-20 h-20',
    iconInner: 'w-8 h-8',
    title: 'text-xl',
    message: 'text-lg',
  },
};

/**
 * Error State Component
 * 
 * Displays error with icon, message, and optional retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  onRetry,
  size = 'md',
  icon: CustomIcon,
  className = '',
}) => {
  const styles = sizeStyles[size];
  const Icon = CustomIcon || ExclamationTriangleIcon;

  return (
    <div
      className={`flex flex-col items-center gap-4 text-center max-w-md mx-auto ${className}`}
    >
      {/* Icon */}
      <div
        className={`
          ${styles.iconContainer}
          rounded-full
          bg-red-100 dark:bg-red-900/20
          flex items-center justify-center
        `.trim()}
      >
        <Icon className={`${styles.iconInner} text-red-600 dark:text-red-400`} />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h3
          className={`${styles.title} font-semibold text-gray-900 dark:text-white`}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {title}
        </h3>
        <p
          className={`${styles.message} text-gray-600 dark:text-gray-400`}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {message}
        </p>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            inline-flex items-center gap-2
            px-4 py-2 rounded-lg
            bg-red-600 hover:bg-red-700
            text-white font-medium text-sm
            transition-colors
          "
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <ArrowPathIcon className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};
