/**
 * TicketFilterBar Component
 * Filter controls for priority, tags, and sort options
 */

import React from 'react';
import { Filter, SortAsc } from 'lucide-react';
import type { TicketTag, SortBy } from '../types';

interface TicketFilterBarProps {
  priorityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low';
  tagFilter: string;
  sortBy: SortBy;
  availableTags: TicketTag[];
  onPriorityChange: (priority: 'all' | 'critical' | 'high' | 'medium' | 'low') => void;
  onTagChange: (tagId: string) => void;
  onSortChange: (sort: SortBy) => void;
  onClearFilters?: () => void;
}

export function TicketFilterBar({
  priorityFilter,
  tagFilter,
  sortBy,
  availableTags,
  onPriorityChange,
  onTagChange,
  onSortChange,
  onClearFilters,
}: TicketFilterBarProps) {
  const hasActiveFilters = priorityFilter !== 'all' || tagFilter !== 'all';

  return (
    <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm space-y-3">
      {/* Priority Filter */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Filter className="h-3 w-3" />
          Priority
        </label>
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as any)}
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tags
          </label>
          <select
            value={tagFilter}
            onChange={(e) => onTagChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.icon} {tag.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort By */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
          <SortAsc className="h-3 w-3" />
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
        >
          <option value="date-newest">Newest First</option>
          <option value="date-oldest">Oldest First</option>
          <option value="priority">Priority</option>
          <option value="responses">Most Responses</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
