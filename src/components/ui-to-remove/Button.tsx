// src/components/ui/button.tsx
import React, { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Utility to combine class names, defined below
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

// Define button variants using class-variance-authority
const buttonVariants = cva(
  'inline-flex items-center justify-center text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md hover:shadow-lg focus:ring-sky-500/50 rounded-xl duration-200',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 shadow-md hover:shadow-lg rounded-xl duration-200',
        outline: 'border border-sky-500/50 text-sky-600 hover:bg-sky-50 backdrop-blur-sm focus:ring-sky-500/50 shadow-sm hover:shadow-md rounded-xl duration-200',
        glass: 'bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90 shadow-md hover:shadow-lg focus:ring-sky-500/50 rounded-xl duration-200',
        edit_plus: 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-700 hover:text-blue-700 rounded-xl border-0 shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.8),inset_0_0_0_rgba(163,177,198,0.1)] hover:shadow-[2px_2px_4px_rgba(163,177,198,0.3),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(163,177,198,0.15),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] hover:-translate-y-0.5 active:translate-y-0 duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden',
        new_plus: 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-700 hover:text-green-700 rounded-xl border-0 shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.8),inset_0_0_0_rgba(163,177,198,0.1)] hover:shadow-[2px_2px_4px_rgba(163,177,198,0.3),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(163,177,198,0.15),inset_-1px_-1px_2px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] hover:-translate-y-0.5 active:translate-y-0 duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-6 px-2',
        lg: 'h-12 px-6',
        admin: 'px-4 py-2',
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

// Hover Edit Buttons Wrapper Component
interface HoverEditButtonsProps {
  onEdit: () => void;
  onNew?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  children?: ReactNode;
  className?: string;
}

const HoverEditButtons: React.FC<HoverEditButtonsProps> = ({ 
  onEdit, 
  onNew,
  position = 'top-right',
  children,
  className
}) => {
  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  return (
    <div className={cn(`absolute ${positionClasses[position]} z-[10000] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-3`, className)}>
      {/* Edit Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        variant="edit_plus"
        size="admin"
        title="Edit"
      >
        <PencilIcon className="w-4 h-4 mr-2" />
        Edit
      </Button>

      {/* New Button (optional) */}
      {onNew && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onNew();
          }}
          variant="new_plus"
          size="admin"
          title="Add New Below"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New
        </Button>
      )}
      
      {children}
    </div>
  );
};

export { Button, buttonVariants, HoverEditButtons };