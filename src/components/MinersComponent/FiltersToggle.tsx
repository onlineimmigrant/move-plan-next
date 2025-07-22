'use client';

import React from 'react';
import Button from '@/ui/Button';
import { FilterState } from './types';

interface FiltersToggleProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: FilterState;
}

export default function FiltersToggle({ showFilters, onToggleFilters, filters }: FiltersToggleProps) {
  const activeFiltersCount = filters.status.length + filters.user.length + filters.model.length;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-xl sm:rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <Button
        onClick={onToggleFilters}
        className={`relative group transition-all duration-300 flex items-center gap-3 backdrop-blur-xl border shadow-lg hover:shadow-xl ${
          showFilters 
            ? 'bg-blue-500/90 text-white border-blue-400/50 shadow-blue-500/20' 
            : 'bg-white/80 text-slate-700 border-white/30 hover:bg-white/90'
        }`}
      >
        <div className={`p-1.5 rounded-lg ${
          showFilters 
            ? 'bg-white/20' 
            : 'bg-gradient-to-r from-emerald-500 to-blue-600'
        }`}>
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${
            showFilters ? 'text-white' : 'text-white'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </div>
        <span>Advanced Filters</span>
        {activeFiltersCount > 0 && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            showFilters 
              ? 'bg-white/20 text-white' 
              : 'bg-blue-600 text-white'
          }`}>
            {activeFiltersCount}
          </span>
        )}
      </Button>
    </div>
  );
}
