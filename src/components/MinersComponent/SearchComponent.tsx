'use client';

import React from 'react';
import { FilterState } from './types';

interface SearchComponentProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function SearchComponent({ filters, onFiltersChange }: SearchComponentProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/30 shadow-lg group-focus-within:shadow-xl transition-all duration-300">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search miners, IPs, users..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 bg-transparent text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl sm:rounded-2xl font-medium"
          />
        </div>
      </div>
    </div>
  );
}
