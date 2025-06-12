import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes (create if not exists)

type Variant = 'primary' | 'secondary' | 'start';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const baseStyles =
      `cursor-pointer inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 
      sm:px-6 sm:py-2 text-sm sm:text-base transition ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;

    const variants: Record<Variant, string> = {
      primary:
        'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500',
      secondary:
        'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    start:
        
        'w-full bg-sky-600 cursor-pointer text-white font-semibold py-3 rounded-lg hover:bg-sky-700 active:bg-sky-800 focus:ring-2 focus:ring-sky-500 transition-all duration-200 shadow-md hover:shadow-lg',

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

export default Button;