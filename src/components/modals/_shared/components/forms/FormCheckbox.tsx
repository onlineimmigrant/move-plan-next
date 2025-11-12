/**
 * FormCheckbox Component
 * 
 * Standardized checkbox for forms
 */

'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface FormCheckboxProps {
  /** Checkbox label */
  label: string;
  
  /** Checked state */
  checked: boolean;
  
  /** Change handler */
  onChange: (checked: boolean) => void;
  
  /** Helper text */
  helperText?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom className */
  className?: string;
}

const sizeStyles = {
  sm: {
    checkbox: 'w-4 h-4',
    label: 'text-sm',
    helper: 'text-xs',
  },
  md: {
    checkbox: 'w-5 h-5',
    label: 'text-base',
    helper: 'text-sm',
  },
  lg: {
    checkbox: 'w-6 h-6',
    label: 'text-lg',
    helper: 'text-base',
  },
};

/**
 * Form Checkbox Component
 * 
 * Checkbox with label and helper text
 */
export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  checked,
  onChange,
  helperText,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const sizes = sizeStyles[size];

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          ${sizes.checkbox}
          flex items-center justify-center
          rounded border-2
          transition-all
          ${checked 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `.trim()}
      >
        {checked && <CheckIcon className="w-3 h-3 text-white" />}
      </button>

      {/* Label & Helper */}
      <div className="flex-1">
        <label
          onClick={() => !disabled && onChange(!checked)}
          className={`
            ${sizes.label}
            block font-medium text-gray-700 dark:text-gray-300
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {label}
        </label>
        
        {helperText && (
          <p
            className={`${sizes.helper} text-gray-500 dark:text-gray-400 mt-1`}
            style={{
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};
