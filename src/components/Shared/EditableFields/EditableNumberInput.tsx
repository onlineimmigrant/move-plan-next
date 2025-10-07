// components/Shared/EditableFields/EditableNumberInput.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface EditableNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  showButtons?: boolean;
  className?: string;
}

export default function EditableNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  error,
  disabled = false,
  required = false,
  helperText,
  showButtons = true,
  className,
}: EditableNumberInputProps) {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex items-center gap-2">
        {showButtons && !disabled && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={min !== undefined && value <= min}
            className={cn(
              'p-2 rounded-lg border border-gray-300 transition-colors',
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <MinusIcon className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg border text-center transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-sky-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
        />

        {showButtons && !disabled && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={max !== undefined && value >= max}
            className={cn(
              'p-2 rounded-lg border border-gray-300 transition-colors',
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <PlusIcon className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {min !== undefined && max !== undefined && (
        <div className="text-xs text-gray-500">
          Range: {min} - {max}
        </div>
      )}

      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500">{helperText}</span>
      ) : null}
    </div>
  );
}
