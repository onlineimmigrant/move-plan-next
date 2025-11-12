/**
 * SearchBar Component
 * 
 * Search input with icon and clear button
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface SearchBarProps {
  /** Search value */
  value: string;
  
  /** Change handler */
  onChange: (value: string) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Debounce delay in ms */
  debounce?: number;
  
  /** Show clear button */
  showClear?: boolean;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Full width */
  fullWidth?: boolean;
  
  /** Auto focus */
  autoFocus?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** ARIA label */
  ariaLabel?: string;
}

const sizeStyles = {
  sm: 'h-8 text-sm pl-8 pr-8',
  md: 'h-10 text-sm pl-10 pr-10',
  lg: 'h-12 text-base pl-12 pr-12',
};

const iconSizes = {
  sm: { icon: 'w-4 h-4', left: 'left-2', right: 'right-2' },
  md: { icon: 'w-5 h-5', left: 'left-3', right: 'right-3' },
  lg: { icon: 'w-6 h-6', left: 'left-3', right: 'right-3' },
};

/**
 * Search Bar Component
 * 
 * Input field with search icon and optional clear button
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounce = 0,
  showClear = true,
  size = 'md',
  fullWidth = false,
  autoFocus = false,
  disabled = false,
  className = '',
  ariaLabel = 'Search',
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      if (debounce > 0) {
        const timeout = setTimeout(() => {
          onChange(newValue);
        }, debounce);
        setDebounceTimeout(timeout);
      } else {
        onChange(newValue);
      }
    },
    [debounce, debounceTimeout, onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  const sizes = iconSizes[size];

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-64'} ${className}`}>
      {/* Search Icon */}
      <MagnifyingGlassIcon
        className={`
          ${sizes.icon} ${sizes.left}
          absolute top-1/2 -translate-y-1/2
          text-gray-400 dark:text-gray-500
          pointer-events-none
        `.trim()}
      />

      {/* Input */}
      <input
        type="text"
        value={debounce > 0 ? localValue : value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className={`
          ${sizeStyles[size]}
          w-full rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
        `.trim()}
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      />

      {/* Clear Button */}
      {showClear && (debounce > 0 ? localValue : value) && !disabled && (
        <button
          onClick={handleClear}
          className={`
            ${sizes.right}
            absolute top-1/2 -translate-y-1/2
            p-1 rounded
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors
          `.trim()}
          aria-label="Clear search"
          type="button"
        >
          <XMarkIcon className={`${sizes.icon} text-gray-400 dark:text-gray-500`} />
        </button>
      )}
    </div>
  );
};
