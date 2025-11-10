import React, { useState } from 'react';
import { BarChart3, Settings, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import type { TicketTag } from '../types';

interface TicketListToolbarProps {
  onViewAnalytics: () => void;
  onViewAssignmentRules: () => void;
  // Filter props
  availableTags: TicketTag[];
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
  // Sort props
  sortBy: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated';
  onSortChange: (sortBy: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated') => void;
  // Advanced filters props
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
}

export default function TicketListToolbar({
  onViewAnalytics,
  onViewAssignmentRules,
  availableTags,
  selectedTags,
  onTagSelect,
  sortBy,
  onSortChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
}: TicketListToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);

  return (
    <div className="border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-4 py-2 gap-2">
        {/* Left side - Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewAnalytics}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="View analytics dashboard"
            title="View Analytics"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          
          <button
            onClick={onViewAssignmentRules}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Manage assignment rules and automation"
            title="Assignment Rules & Automation"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>

        {/* Right side - Filters button */}
        <button
          onClick={() => setShowFiltersAccordion(!showFiltersAccordion)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            showFiltersAccordion
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Toggle filters"
          title="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {showFiltersAccordion ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Filters accordion */}
      {showFiltersAccordion && (
        <div className="border-t border-slate-200 dark:border-gray-700 p-4 bg-slate-50 dark:bg-gray-900/50 space-y-4">
          {/* Filter by Tag */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filter by Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No tags available</p>
              ) : (
                availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onTagSelect(tag.id)}
                    className={`px-2 py-1 text-xs rounded-full transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                        : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                    style={
                      selectedTags.includes(tag.id) && tag.color
                        ? { backgroundColor: tag.color + '20', borderColor: tag.color }
                        : {}
                    }
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSortChange('updated')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  sortBy === 'updated'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                Recent Activity
              </button>
              <button
                onClick={() => onSortChange('date-newest')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  sortBy === 'date-newest'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => onSortChange('date-oldest')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  sortBy === 'date-oldest'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                Oldest First
              </button>
              <button
                onClick={() => onSortChange('priority')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  sortBy === 'priority'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                Priority
              </button>
              <button
                onClick={() => onSortChange('responses')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  sortBy === 'responses'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                Most Responses
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div>
            <button
              onClick={onToggleAdvancedFilters}
              className={`w-full px-3 py-2 text-sm rounded-lg transition-all text-left flex items-center justify-between ${
                showAdvancedFilters
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                  : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Advanced Filters
              </span>
              {showAdvancedFilters && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
