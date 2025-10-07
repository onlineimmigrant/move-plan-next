// components/Shared/EditableFields/EditableToggle.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EditableToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export default function EditableToggle({
  label,
  value,
  onChange,
  description,
  disabled = false,
  className,
}: EditableToggleProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
          value ? 'bg-sky-600' : 'bg-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
            value ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
