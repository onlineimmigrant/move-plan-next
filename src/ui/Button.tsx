import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes

type Variant = 'primary' | 'secondary' | 'start' | 'close' | 'link' | 'outline' | 'light-outline' | 'badge_primary' | 'badge_primary_circle' | 'manage'; // Added 'outline', 'light-outline' and 'manage'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading = false, loadingText = 'Loading...', children, disabled, ...props }, ref) => {
    const baseStyles =
      `cursor-pointer inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 
      sm:px-6 sm:py-2 text-sm sm:text-sm transition-all duration-300 group ease-in-out 
      focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;

    const variants: Record<Variant, string> = {
      primary: 'shadow-lg bg-sky-600 text-white hover:bg-sky-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 focus:ring-sky-500',
      badge_primary: 'py-0.5 sm:py-1 px-1 sm:px-1.5 shadow hover:shadow-lg rounded-full text-[10px] sm:text-xs font-medium cursor-pointer text-gray-800 bg-gray-100 hover:bg-gray-300 flex items-center gap-1',
       badge_primary_circle: 'py-2 sm:py-2 px-2 sm:px-2 shadow hover:shadow-lg rounded-full text-[10px] sm:text-xs font-medium cursor-pointer text-gray-800 bg-gray-100 hover:bg-gray-300 flex items-center gap-1',

      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      
      start:
        'w-full font-medium bg-sky-600 text-white font-semibold py-2 rounded-lg hover:bg-sky-700 hover:shadow-xl hover:-translate-y-0.5 active:bg-sky-800 active:translate-y-0 focus:ring-2 focus:ring-sky-500 transition-all duration-300 ease-out shadow-md',
      close:
        'absolute top-2 right-2 text-gray-700 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-gray-500',
      link:
        'px-0 sm:px-0 text-sky-600 hover:text-sky-700 focus:ring-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500',
      outline:
        'shadow-sm bg-transparent border border-gray-300 text-gray-700 hover:border-sky-600 hover:text-sky-600 focus:ring-sky-500',
      'light-outline':
        'shadow-sm bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      manage:
        'relative w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 disabled:from-sky-400 disabled:to-sky-500 text-white font-medium rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 disabled:transform-none disabled:shadow-none transition-all duration-300 ease-out',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
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
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';



// Disclosure

export default Button;