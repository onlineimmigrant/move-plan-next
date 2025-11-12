/**
 * EmptyState Component
 * 
 * Empty state display for modal content
 */

'use client';

import React from 'react';
import { InboxIcon, PlusIcon } from '@heroicons/react/24/outline';

export interface EmptyStateProps {
  /** Empty state title */
  title?: string;
  
  /** Empty state message */
  message: string;
  
  /** Optional action handler */
  onAction?: () => void;
  
  /** Action button text */
  actionText?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Show action icon */
  showActionIcon?: boolean;
  
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
 * Empty State Component
 * 
 * Displays empty state with icon, message, and optional action button
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data',
  message,
  onAction,
  actionText = 'Add Item',
  size = 'md',
  icon: CustomIcon,
  showActionIcon = true,
  className = '',
}) => {
  const styles = sizeStyles[size];
  const Icon = CustomIcon || InboxIcon;

  return (
    <div
      className={`flex flex-col items-center gap-4 text-center max-w-md mx-auto ${className}`}
    >
      {/* Icon */}
      <div
        className={`
          ${styles.iconContainer}
          rounded-full
          bg-gray-100 dark:bg-gray-800
          flex items-center justify-center
        `.trim()}
      >
        <Icon className={`${styles.iconInner} text-gray-400 dark:text-gray-500`} />
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

      {/* Action Button */}
      {onAction && actionText && (
        <button
          onClick={onAction}
          className="
            inline-flex items-center gap-2
            px-4 py-2 rounded-lg
            bg-blue-600 hover:bg-blue-700
            text-white font-medium text-sm
            transition-colors
          "
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {showActionIcon && <PlusIcon className="w-4 h-4" />}
          {actionText}
        </button>
      )}
    </div>
  );
};
