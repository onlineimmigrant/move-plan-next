/**
 * FilterSelect Component
 * 
 * Dropdown filter with multiple selection
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterSelectProps {
  /** Filter label */
  label: string;
  
  /** Available options */
  options: FilterOption[];
  
  /** Selected values */
  value: string[];
  
  /** Change handler */
  onChange: (selected: string[]) => void;
  
  /** Allow multiple selection */
  multiple?: boolean;
  
  /** Placeholder when nothing selected */
  placeholder?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom className */
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-4',
  lg: 'h-12 text-base px-4',
};

/**
 * Filter Select Component
 * 
 * Dropdown with single or multiple selection
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select...',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (multiple) {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    } else {
      onChange([optionValue]);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const option = options.find((opt) => opt.value === value[0]);
      return option?.label || placeholder;
    }
    return `${value.length} selected`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      <label
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {label}
      </label>

      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          ${sizeStyles[size]}
          w-full flex items-center justify-between gap-2
          rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          hover:border-gray-400 dark:hover:border-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          text-gray-900 dark:text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
        `.trim()}
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <span className={value.length === 0 ? 'text-gray-400 dark:text-gray-500' : ''}>
          {getDisplayText()}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          className="
            absolute z-10 mt-1 w-full
            rounded-lg
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            shadow-lg
            max-h-60 overflow-y-auto
          "
        >
          {options.map((option) => {
            const isSelected = value.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleToggle(option.value)}
                disabled={option.disabled}
                className={`
                  w-full flex items-center justify-between gap-2
                  px-4 py-2
                  text-left text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `.trim()}
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <span className={isSelected ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}>
                  {option.label}
                </span>
                {isSelected && (
                  <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
