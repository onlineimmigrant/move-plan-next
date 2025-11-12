/**
 * StatusBadge Component
 * 
 * Displays status with text and optional icon
 */

'use client';

import React from 'react';

export interface StatusBadgeProps {
  /** Status text */
  text: string;
  
  /** Badge variant */
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show as dot with text */
  dot?: boolean;
  
  /** Custom className */
  className?: string;
}

const variantStyles = {
  success: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  default: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-500',
  },
};

const sizeClasses = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    padding: 'px-2.5 py-1',
    text: 'text-sm',
    icon: 'w-4 h-4',
    dot: 'w-2 h-2',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    icon: 'w-5 h-5',
    dot: 'w-2.5 h-2.5',
  },
};

/**
 * Status Badge Component
 * 
 * Displays status with colored background and optional icon/dot
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  variant = 'default',
  icon: Icon,
  size = 'md',
  dot = false,
  className = '',
}) => {
  const styles = variantStyles[variant];
  const sizes = sizeClasses[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-medium
        ${styles.bg} ${styles.text} ${sizes.padding} ${sizes.text} ${className}
      `.trim()}
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {dot && (
        <span className={`inline-block rounded-full ${sizes.dot} ${styles.dot}`} />
      )}
      {Icon && !dot && <Icon className={sizes.icon} />}
      {text}
    </span>
  );
};
