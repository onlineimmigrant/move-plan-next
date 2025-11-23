/**
 * ProductSearchBar Component
 * 
 * Search input with debounce integration
 * Used for filtering products by name/description
 */

'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface ProductSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  resultsCount?: number;
}

export function ProductSearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search products...',
  resultsCount,
}: ProductSearchBarProps) {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="
          w-full pl-10 pr-10 py-2.5 rounded-lg border
          border-slate-300 dark:border-gray-600
          bg-white dark:bg-gray-800 
          text-slate-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 focus:outline-none
          placeholder:text-slate-400 dark:placeholder:text-slate-500
        "
        placeholder={placeholder}
        aria-label="Search products"
      />

      {/* Clear Button or Results Count */}
      {searchQuery ? (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </button>
      ) : resultsCount !== undefined ? (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {resultsCount} {resultsCount === 1 ? 'product' : 'products'}
          </span>
        </div>
      ) : null}
    </div>
  );
}
