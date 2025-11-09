/**
 * Input Component
 * 
 * Standardized input and textarea components with glass morphism styling,
 * validation states, and accessibility features.
 */

import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
}

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseInputProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Input Component
 * 
 * Standard text input with glass morphism styling and validation.
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email Address"
 *   type="email"
 *   placeholder="you@example.com"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={emailError}
 *   required
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={`
            w-full px-3 py-2.5
            border rounded-lg
            transition-all duration-200
            bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              hasError
                ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/50'
            }
            ${className}
          `.trim()}
          {...props}
        />

        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 * 
 * Multi-line text input with glass morphism styling and auto-resize support.
 * 
 * @example
 * ```tsx
 * <Textarea
 *   label="Message"
 *   placeholder="Describe your issue..."
 *   value={message}
 *   onChange={(e) => setMessage(e.target.value)}
 *   rows={4}
 *   required
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      fullWidth = true,
      className = '',
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          className={`
            w-full px-3 py-2.5
            border rounded-lg
            transition-all duration-200
            bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-vertical
            ${
              hasError
                ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/50'
            }
            ${className}
          `.trim()}
          {...props}
        />

        {hint && !error && (
          <p
            id={`${textareaId}-hint`}
            className="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
