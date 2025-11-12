/**
 * IconButton Component
 * 
 * Icon-only button for modal actions
 */

'use client';

import React from 'react';

export interface IconButtonProps {
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Button variant */
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** ARIA label (required for accessibility) */
  ariaLabel: string;
  
  /** Tooltip text */
  tooltip?: string;
  
  /** Custom className */
  className?: string;
}

const variantStyles = {
  default: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400',
  primary: 'hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  danger: 'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400',
  ghost: 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400',
};

const sizeStyles = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * Icon Button Component
 * 
 * Compact icon-only button for toolbar actions
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  ariaLabel,
  tooltip,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={tooltip || ariaLabel}
      className={`
        inline-flex items-center justify-center
        rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
};
