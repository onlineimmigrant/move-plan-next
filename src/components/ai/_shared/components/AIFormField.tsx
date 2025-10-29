/**
 * AI Form Field Component
 * Reusable form field with label, input, error display, and validation
 */

'use client';

import React from 'react';
import { AIIcons } from './AIIcons';
import { AIFormFieldProps } from '../types';

// ============================================================================
// Component
// ============================================================================

export const AIFormField: React.FC<AIFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  helpText,
  placeholder,
  disabled = false,
  icon,
  options = [],
  rows = 4,
  min,
  max,
  step,
  className = ""
}) => {
  // Input class names with error state
  const inputBaseClasses = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-colors
  `;

  const inputClasses = error
    ? `${inputBaseClasses} border-red-500 focus:ring-red-500`
    : `${inputBaseClasses} border-gray-300`;

  // Render input element based on type
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${inputClasses} resize-y ${className}`}
            aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
            aria-invalid={!!error}
          />
        );

      case 'select':
        return (
          <div className="relative">
            <select
              id={name}
              name={name}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              className={`${inputClasses} pr-10 appearance-none ${className}`}
              aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
              aria-invalid={!!error}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <AIIcons.ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={`${inputClasses} ${className}`}
            aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
            aria-invalid={!!error}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inputClasses} ${className}`}
            aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
            aria-invalid={!!error}
          />
        );

      default: // text
        return (
          <input
            type="text"
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inputClasses} ${className}`}
            aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
            aria-invalid={!!error}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input with optional icon */}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <div className={icon ? 'pl-10' : ''}>
          {renderInput()}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id={`${name}-error`}
          className="flex items-center mt-1 text-red-600 text-sm"
          role="alert"
        >
          <AIIcons.AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {!error && helpText && (
        <p
          id={`${name}-help`}
          className="text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};
