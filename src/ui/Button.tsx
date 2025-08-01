import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes

type Variant = 'primary' | 'secondary' | 'start' | 'close' | 'link' | 'outline' | 'badge_primary' | 'badge_primary_circle'; // Added 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const baseStyles =
      `cursor-pointer inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 
      sm:px-6 sm:py-2 text-sm sm:text-sm transition-all duration-300 group ease-in-out 
      focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;

    const variants: Record<Variant, string> = {
      primary: 'shadow-lg bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500',
      badge_primary: 'py-0.5 sm:py-1 px-1 sm:px-1.5 shadow hover:shadow-lg rounded-full text-[10px] sm:text-xs font-medium cursor-pointer text-gray-800 bg-gray-100 hover:bg-gray-300 flex items-center gap-1',
       badge_primary_circle: 'py-2 sm:py-2 px-2 sm:px-2 shadow hover:shadow-lg rounded-full text-[10px] sm:text-xs font-medium cursor-pointer text-gray-800 bg-gray-100 hover:bg-gray-300 flex items-center gap-1',

      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      
      start:
        'w-full font-medium bg-sky-600 text-white font-semibold py-2 rounded-lg hover:bg-sky-700 active:bg-sky-800 focus:ring-2 focus:ring-sky-500 transition-all duration-200 shadow-md hover:shadow-lg',
      close:
        'absolute top-2 right-2 text-gray-700 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-gray-500',
      link:
        'px-0 sm:px-0 text-sky-600 hover:text-sky-700 focus:ring-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500',
      outline:
        'shadow-sm bg-transparent border border-gray-300 text-gray-700 hover:border-sky-600 hover:text-sky-600 focus:ring-sky-500',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';



// Disclosure

export default Button;