// components/Shared/EditableFields/EditableSelect.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface EditableSelectOption {
  value: string;
  label: string;
}

interface EditableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: EditableSelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  className?: string;
}

export default function EditableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  helperText,
  className,
}: EditableSelectProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 pr-10 rounded-lg border transition-colors appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            !value && 'text-gray-400'
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none',
            disabled ? 'text-gray-400' : 'text-gray-500'
          )}
        />
      </div>

      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500">{helperText}</span>
      ) : null}
    </div>
  );
}
