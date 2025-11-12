/**
 * FormInput Component
 * 
 * Standardized text input for forms
 */

'use client';

import React from 'react';

export interface FormInputProps {
  /** Input label */
  label: string;
  
  /** Input value */
  value: string;
  
  /** Change handler */
  onChange: (value: string) => void;
  
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number';
  
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
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Full width */
  fullWidth?: boolean;
  
  /** Auto focus */
  autoFocus?: boolean;
  
  /** Custom className */
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-4',
  lg: 'h-12 text-base px-4',
};

/**
 * Form Input Component
 * 
 * Text input with label, helper text, and error states
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  size = 'md',
  fullWidth = true,
  autoFocus = false,
  className = '',
}) => {
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      <label
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        className={`
          ${sizeStyles[size]}
          w-full rounded-lg
          bg-white dark:bg-gray-800
          border ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-transparent
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
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
