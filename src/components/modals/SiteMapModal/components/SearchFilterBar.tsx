/**
 * SearchFilterBar Component
 * Search and filter controls for sitemap tree
 * Matching HeaderEditModal design patterns
 */

'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SearchFilterBarProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  primaryColor: string;
}

export interface FilterState {
  type: string[];
  priority: string[];
  changefreq: string[];
}

export function SearchFilterBar({ onSearchChange, onFilterChange, primaryColor }: SearchFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    priority: [],
    changefreq: [],
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  const handleFilterToggle = (category: keyof FilterState, value: string) => {
    const newFilters = { ...filters };
    const index = newFilters[category].indexOf(value);
    
    if (index > -1) {
      newFilters[category].splice(index, 1);
    } else {
      newFilters[category].push(value);
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { type: [], priority: [], changefreq: [] };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = filters.type.length + filters.priority.length + filters.changefreq.length;

  return (
    <div className="space-y-3">
      {/* Search and Filter Toggle */}
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search pages..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
            style={{ 
              '--tw-ring-color': `${primaryColor}40` 
            } as React.CSSProperties}
          />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2',
            showFilters 
              ? 'shadow-lg'
              : 'border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
          style={showFilters ? {
            backgroundColor: `${primaryColor}20`,
            borderColor: primaryColor,
            color: primaryColor,
          } : {}}
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            title="Clear all filters"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 space-y-4">
          {/* Page Type Filter */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Page Type</h4>
            <div className="flex flex-wrap gap-2">
              {['home', 'static', 'blog', 'feature', 'product'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterToggle('type', type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    filters.type.includes(type)
                      ? 'shadow-md'
                      : 'border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                  style={filters.type.includes(type) ? {
                    backgroundColor: `${primaryColor}20`,
                    borderColor: primaryColor,
                    color: primaryColor,
                  } : {}}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Priority</h4>
            <div className="flex flex-wrap gap-2">
              {['1.0', '0.9', '0.8', '0.7', '0.5'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleFilterToggle('priority', priority)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    filters.priority.includes(priority)
                      ? 'shadow-md'
                      : 'border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                  style={filters.priority.includes(priority) ? {
                    backgroundColor: `${primaryColor}20`,
                    borderColor: primaryColor,
                    color: primaryColor,
                  } : {}}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Change Frequency Filter */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Update Frequency</h4>
            <div className="flex flex-wrap gap-2">
              {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                <button
                  key={freq}
                  onClick={() => handleFilterToggle('changefreq', freq)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize',
                    filters.changefreq.includes(freq)
                      ? 'shadow-md'
                      : 'border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                  style={filters.changefreq.includes(freq) ? {
                    backgroundColor: `${primaryColor}20`,
                    borderColor: primaryColor,
                    color: primaryColor,
                  } : {}}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
