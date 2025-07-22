'use client';

import React from 'react';
import SearchComponent from './SearchComponent';
import FiltersToggle from './FiltersToggle';
import AdvancedFilters from './AdvancedFilters';
import { FilterState, SortState, GroupByKey } from './types';

interface ControlsPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  uniqueStatuses: string[];
  uniqueUsers: string[];
  uniqueModels: string[];
}

export default function ControlsPanel({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  uniqueStatuses,
  uniqueUsers,
  uniqueModels
}: ControlsPanelProps) {
  return (
    <div className="mb-8 sm:mb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl shadow-black/5"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 via-blue-50/40 to-purple-50/40"></div>
      <div className="relative p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Primary Controls Row */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 sm:gap-6">
            {/* Advanced Search */}
            <SearchComponent 
              filters={filters}
              onFiltersChange={onFiltersChange}
            />

            {/* Filters Toggle */}
            <FiltersToggle 
              showFilters={showFilters}
              onToggleFilters={onToggleFilters}
              filters={filters}
            />
          </div>

          {/* Advanced Filters Panel */}
          <AdvancedFilters 
            showFilters={showFilters}
            filters={filters}
            onFiltersChange={onFiltersChange}
            uniqueStatuses={uniqueStatuses}
            uniqueUsers={uniqueUsers}
            uniqueModels={uniqueModels}
          />
        </div>
      </div>
    </div>
  );
}
