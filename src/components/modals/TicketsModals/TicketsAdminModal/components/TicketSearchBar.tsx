/**
 * TicketSearchBar Component
 * Search input with clear button for filtering tickets
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface TicketSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TicketSearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search tickets...',
  disabled = false,
}: TicketSearchBarProps) {
  return (
    <div className="p-4 border-b border-slate-200 bg-white">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-200"
        />
        {value && (
          <button
            onClick={onClear}
            disabled={disabled}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
