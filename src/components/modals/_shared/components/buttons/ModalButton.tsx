/**
 * ModalButton Component
 * 
 * Standardized button for modal actions
 */

'use client';

import React from 'react';

export interface ModalButtonProps {
  /** Button text */
  children: React.ReactNode;
  
  /** Click handler */
  onClick?: () => void | Promise<void>;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'link';
  
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Loading state */
  loading?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Full width */
  fullWidth?: boolean;
  
  /** Optional icon (left side) */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Optional icon (right side) */
  iconRight?: React.ComponentType<{ className?: string }>;
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  
  /** Custom className */
  className?: string;
  
  /** ARIA label */
  ariaLabel?: string;
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400',
  secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400',
  success: 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  link: 'bg-transparent hover:underline text-blue-600 dark:text-blue-400 p-0',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

/**
 * Modal Button Component
 * 
 * Standardized button with loading states and variants
 */
export const ModalButton: React.FC<ModalButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  className = '',
  ariaLabel,
}) => {
  const handleClick = async () => {
    if (onClick && !loading && !disabled) {
      await onClick();
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${variant !== 'link' ? sizeStyles[size] : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
          {IconRight && <IconRight className="w-4 h-4" />}
        </>
      )}
    </button>
  );
};
