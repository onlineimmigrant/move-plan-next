/**
 * CountBadge Component
 * 
 * Displays a count badge with adaptive sizing and animations
 */

'use client';

import React from 'react';

export interface CountBadgeProps {
  /** Count to display */
  count: number | string;
  
  /** Badge variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  
  /** Custom color class (overrides variant) */
  color?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Enable pulse animation */
  animate?: boolean;
  
  /** Maximum number before showing "+" */
  max?: number;
  
  /** Custom className */
  className?: string;
  
  /** Show dot instead of count */
  dot?: boolean;
}

const variantColors = {
  primary: 'bg-blue-500',
  secondary: 'bg-gray-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
};

const sizeClasses = {
  sm: {
    single: 'w-4 h-4 text-[10px]',
    multi: 'min-w-[18px] h-4 px-1 text-[10px]',
    dot: 'w-2 h-2',
  },
  md: {
    single: 'w-5 h-5 text-xs',
    multi: 'min-w-[24px] h-5 px-1.5 text-xs',
    dot: 'w-2.5 h-2.5',
  },
  lg: {
    single: 'w-6 h-6 text-sm',
    multi: 'min-w-[28px] h-6 px-2 text-sm',
    dot: 'w-3 h-3',
  },
};

/**
 * Count Badge Component
 * 
 * Adaptive badge that adjusts size based on count length
 */
export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  variant = 'danger',
  color,
  size = 'md',
  animate = false,
  max = 99,
  className = '',
  dot = false,
}) => {
  // Format count
  const formattedCount = typeof count === 'number' && count > max ? `${max}+` : count;
  const countLength = formattedCount.toString().length;
  
  // Determine size class
  const sizeClass = dot 
    ? sizeClasses[size].dot 
    : countLength > 1 
    ? sizeClasses[size].multi 
    : sizeClasses[size].single;
  
  // Determine color
  const colorClass = color || variantColors[variant];
  
  // Animation class
  const animationClass = animate ? 'animate-pulse' : '';

  if (dot) {
    return (
      <span
        className={`
          inline-block rounded-full ${sizeClass} ${colorClass} ${animationClass} ${className}
        `.trim()}
        aria-label="Notification indicator"
      />
    );
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full font-bold text-white
        ${sizeClass} ${colorClass} ${animationClass} ${className}
      `.trim()}
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {formattedCount}
    </span>
  );
};
