/**
 * Button Component
 * 
 * Standardized button component with glass morphism styling,
 * multiple variants, sizes, and states.
 */

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './LoadingState';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Get button classes based on variant
 */
const getVariantClasses = (variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'primary':
      return 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg';
    case 'secondary':
      return 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600';
    case 'ghost':
      return 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 backdrop-blur-sm';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg';
    case 'success':
      return 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg';
    default:
      return 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg';
  }
};

/**
 * Get button size classes
 */
const getSizeClasses = (size: ButtonProps['size']) => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm min-h-[36px]';
    case 'md':
      return 'px-4 py-2.5 text-sm min-h-[44px]';
    case 'lg':
      return 'px-6 py-3 text-base min-h-[48px]';
    default:
      return 'px-4 py-2.5 text-sm min-h-[44px]';
  }
};

/**
 * Button Component
 * 
 * Standardized button with glass morphism styling and multiple variants.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
 *   Submit Ticket
 * </Button>
 * 
 * <Button variant="secondary" size="sm" icon={<EditIcon />}>
 *   Edit
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  const widthClass = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses}
        ${sizeClasses}
        ${widthClass}
        ${className}
      `.trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'sm' ? 'sm' : 'md'} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

/**
 * IconButton Component
 * 
 * Button with only an icon, typically used for toolbars and compact UIs.
 * 
 * @example
 * ```tsx
 * <IconButton icon={<CloseIcon />} onClick={handleClose} aria-label="Close" />
 * ```
 */
export const IconButton: React.FC<{
  icon: ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  'aria-label': string;
  title?: string;
}> = ({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'p-1.5 min-w-[32px] min-h-[32px]',
    md: 'p-2 min-w-[40px] min-h-[40px]',
    lg: 'p-2.5 min-w-[44px] min-h-[44px]',
  };

  const variantClasses = {
    ghost: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40',
    primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 dark:hover:bg-blue-900/20',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50/60 dark:hover:bg-red-900/20',
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded-lg backdrop-blur-sm
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};

export default Button;
