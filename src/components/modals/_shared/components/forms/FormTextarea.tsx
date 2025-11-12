/**
 * FormTextarea Component
 * 
 * Standardized textarea for forms
 */

'use client';

import React from 'react';

export interface FormTextareaProps {
  /** Textarea label */
  label: string;
  
  /** Textarea value */
  value: string;
  
  /** Change handler */
  onChange: (value: string) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Error message */
  error?: string;
  
  /** Required field */
  required?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Number of rows */
  rows?: number;
  
  /** Auto-resize */
  autoResize?: boolean;
  
  /** Full width */
  fullWidth?: boolean;
  
  /** Auto focus */
  autoFocus?: boolean;
  
  /** Character limit */
  maxLength?: number;
  
  /** Show character count */
  showCount?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * Form Textarea Component
 * 
 * Multi-line text input with label, helper text, and error states
 */
export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  rows = 4,
  autoResize = false,
  fullWidth = true,
  autoFocus = false,
  maxLength,
  showCount = false,
  className = '',
}) => {
  const hasError = !!error;
  const charCount = value.length;
  const showCharCount = showCount || (maxLength && maxLength > 0);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-1">
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {showCharCount && (
          <span
            className={`
              text-xs
              ${maxLength && charCount > maxLength ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
            `.trim()}
            style={{
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {maxLength ? `${charCount}/${maxLength}` : charCount}
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full rounded-lg
          px-4 py-2.5 text-sm
          bg-white dark:bg-gray-800
          border ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-transparent
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${autoResize ? 'resize-none' : 'resize-y'}
        `.trim()}
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      />

      {/* Helper Text / Error */}
      {(helperText || error) && (
        <p
          className={`
            text-xs mt-1
            ${hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};
