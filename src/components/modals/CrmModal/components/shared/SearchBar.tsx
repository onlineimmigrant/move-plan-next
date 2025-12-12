/**
 * SearchBar Component
 * 
 * Reusable search input with icon and result count
 * Used across all CRM views for consistent search UI
 */

'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  resultLabel?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  resultCount,
  resultLabel = 'results'
}: SearchBarProps) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
          />
        </div>
        {resultCount !== undefined && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {resultCount} {resultCount === 1 ? resultLabel.replace(/s$/, '') : resultLabel}
          </div>
        )}
      </div>
    </div>
  );
}
