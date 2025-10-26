'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

type Variant = 'primary' | 'secondary' | 'start' | 'close' | 'link' | 'outline' | 'light-outline' | 'danger' | 'badge_primary' | 'badge_primary_circle' | 'manage' | 'edit_plus' | 'new_plus';
type Size = 'sm' | 'default' | 'lg' | 'admin';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', loading = false, loadingText = 'Loading...', children, disabled, ...props }, ref) => {
    const themeColors = useThemeColors();
    
    // Debug: Log theme colors
    if (typeof window !== 'undefined' && variant === 'primary') {
      console.log('Button theme colors:', themeColors.cssVars.primary);
    }
    
    const baseStyles =
      `cursor-pointer inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-300 group ease-in-out 
      focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;

    const sizeStyles: Record<Size, string> = {
      sm: 'px-3 py-1.5 text-xs',
      default: 'px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-sm',
      lg: 'px-6 py-3 text-base',
      admin: 'px-3 py-1.5 text-xs',
    };

    // Variant styles with CSS classes (no dynamic interpolation)
    const variantClasses: Record<Variant, string> = {
      primary: 'btn-primary shadow-lg text-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0',
      badge_primary: 'py-0.5 sm:py-1 px-1 sm:px-1.5 shadow hover:shadow-lg rounded-full text-[10px] sm:text-xs font-medium cursor-pointer text-gray-800 bg-gray-100 hover:bg-gray-300 flex items-center gap-1',
      badge_primary_circle: 'py-2 sm:py-2 px-2 sm:px-2 shadow hover:shadow-lg rounded-full text-[10px] sm:text-xs font-medium cursor-pointer text-gray-800 bg-gray-100 hover:bg-gray-300 flex items-center gap-1',
      secondary: 'btn-secondary text-white',
      start: 'btn-primary w-full font-medium text-white font-semibold py-2 rounded-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 transition-all duration-300 ease-out shadow-md',
      close: 'absolute top-2 right-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500',
      link: 'btn-link px-0 sm:px-0 focus:ring-gray-500 hover:underline focus:outline-none focus:ring-2',
      outline: 'btn-outline shadow-sm bg-transparent border border-gray-300 text-gray-700',
      'light-outline': 'shadow-sm bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      danger: 'shadow-lg bg-red-600 text-white hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 focus:ring-red-500',
      manage: 'btn-primary relative w-full py-3.5 px-4 text-white font-medium rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 disabled:transform-none disabled:shadow-none transition-all duration-300 ease-out',
      edit_plus: 'relative overflow-hidden font-medium text-gray-700 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.8),inset_0_0_0_rgba(163,177,198,0.1)] hover:shadow-[2px_2px_4px_rgba(163,177,198,0.3),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(163,177,198,0.15),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] hover:text-blue-700 hover:-translate-y-0.5 active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] active:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
      new_plus: 'relative overflow-hidden font-medium text-gray-700 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.8),inset_0_0_0_rgba(163,177,198,0.1)] hover:shadow-[2px_2px_4px_rgba(163,177,198,0.3),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(163,177,198,0.15),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] hover:text-green-700 hover:-translate-y-0.5 active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] active:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
    };

    // Inline styles for dynamic colors (using CSS variables)
    const getVariantStyles = (variant: Variant): React.CSSProperties => {
      switch (variant) {
        case 'primary':
        case 'start':
          return {
            backgroundColor: themeColors.cssVars.primary.base,
          } as React.CSSProperties;
        case 'secondary':
          return {
            backgroundColor: themeColors.cssVars.secondary.base,
          } as React.CSSProperties;
        case 'manage':
          return {
            backgroundImage: `linear-gradient(to right, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
          } as React.CSSProperties;
        default:
          return {};
      }
    };

    return (
      <button
        className={cn(baseStyles, sizeStyles[size], variantClasses[variant], className)}
        style={getVariantStyles(variant)}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {variant === 'manage' ? (
          <>
            <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {children}
            </span>
            
            {/* Loading spinner for manage variant */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">{loadingText}</span>
                </div>
              </div>
            )}
            
            {/* Subtle shine effect on hover for manage variant */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          </>
        ) : (variant === 'edit_plus' || variant === 'new_plus') ? (
          <>
            {children}
            {/* Glow overlay effect for neomorphic buttons */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"></div>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// HoverEditButtons Component
interface HoverEditButtonsProps {
  onEdit: () => void;
  onNew?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-right-below-menu';
  className?: string;
  children?: ReactNode;
}

export const HoverEditButtons = ({
  onEdit,
  onNew,
  position = 'top-right',
  className,
  children,
}: HoverEditButtonsProps) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right-below-menu': 'top-24 right-4', // Below the header menu
  };

  return (
    <div
      className={cn(
        'absolute z-10 flex items-center gap-2',
        'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200',
        positionClasses[position],
        className
      )}
    >
      <Button
        variant="edit_plus"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="flex items-center gap-1.5"
      >
        <PencilIcon className="w-4 h-4" />
        <span>Edit</span>
      </Button>

      {onNew && (
        <Button
          variant="new_plus"
          onClick={(e) => {
            e.stopPropagation();
            onNew();
          }}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New</span>
        </Button>
      )}

      {children}
    </div>
  );
};

// Disclosure

export default Button;