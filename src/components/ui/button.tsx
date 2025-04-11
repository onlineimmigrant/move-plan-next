// src/components/ui/button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Utility to combine class names, defined below

// Define button variants using class-variance-authority
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
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