// src/components/ui/button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Utility to combine class names, defined below

// Define button variants using class-variance-authority
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md hover:shadow-lg focus:ring-sky-500/50',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 shadow-md hover:shadow-lg',
        outline: 'border border-sky-500/50 text-sky-600 hover:bg-sky-50 backdrop-blur-sm focus:ring-sky-500/50 shadow-sm hover:shadow-md',
        glass: 'bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90 shadow-md hover:shadow-lg focus:ring-sky-500/50',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-6 px-2 ',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button: React.FC<ButtonProps> = ({ className, variant, size, ...props }) => {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
};

export { Button, buttonVariants };