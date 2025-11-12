/**
 * FilterTags Component
 * 
 * Display and remove active filters as tags
 */

'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export interface FilterTagsProps {
  /** Active filters */
  filters: ActiveFilter[];
  
  /** Remove filter handler */
  onRemove: (key: string) => void;
  
  /** Clear all filters handler */
  onClearAll?: () => void;
  
  /** Size variant */
  size?: 'sm' | 'md';
  
  /** Custom className */
  className?: string;
}

const sizeStyles = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1',
};

/**
 * Filter Tags Component
 * 
 * Shows active filters as removable tags
 */
export const FilterTags: React.FC<FilterTagsProps> = ({
  filters,
  onRemove,
  onClearAll,
  size = 'md',
  className = '',
}) => {
  if (filters.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Filter Tags */}
      {filters.map((filter) => (
        <span
          key={filter.key}
          className={`
            ${sizeStyles[size]}
            inline-flex items-center gap-1.5
            rounded-full
            bg-blue-100 dark:bg-blue-900/20
            text-blue-700 dark:text-blue-400
            font-medium
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <span>{filter.label}: {filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="
              p-0.5 rounded-full
              hover:bg-blue-200 dark:hover:bg-blue-800
              transition-colors
            "
            aria-label={`Remove ${filter.label} filter`}
            type="button"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Clear All Button */}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          className={`
            ${sizeStyles[size]}
            text-gray-600 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-white
            font-medium
            transition-colors
          `.trim()}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
          type="button"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
