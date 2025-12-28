'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CustomersToolbarProps {
  totalCount: number;
  filteredCount: number;
  statusFilter: 'all' | 'active' | 'inactive';
  typeFilter: 'all' | 'paid' | 'free';
  onStatusFilterChange: (filter: 'all' | 'active' | 'inactive') => void;
  onTypeFilterChange: (filter: 'all' | 'paid' | 'free') => void;
  onAddCustomer?: () => void;
}

export default function CustomersToolbar({
  totalCount,
  filteredCount,
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  onAddCustomer,
}: CustomersToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [hoveredStatusFilter, setHoveredStatusFilter] = useState<string | null>(null);
  const [hoveredTypeFilter, setHoveredTypeFilter] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const statusFilters = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
  ] as const;

  const typeFilters = [
    { id: 'all', label: 'All Types' },
    { id: 'paid', label: 'Paid' },
    { id: 'free', label: 'Free' },
  ] as const;

  return (
    <div className="border-t border-slate-200/50 bg-white/30 backdrop-blur-sm rounded-b-2xl">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-5 py-3 gap-2">
        {/* Left side - Filters button */}
        <button
          onClick={() => setShowFiltersAccordion(!showFiltersAccordion)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 shadow-sm"
          aria-label="Toggle filters"
          title="Filters"
          style={{ color: primary.base }}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/30">
            {filteredCount}/{totalCount}
          </span>
          {showFiltersAccordion ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {/* Right side - Add Customer button */}
        {onAddCustomer && (
          <button
            onClick={onAddCustomer}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Filters accordion */}
      {showFiltersAccordion && (
        <div className="border-t border-slate-200/50 p-4 bg-white/30 backdrop-blur-sm space-y-4">
          {/* Status Filters */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Status
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onStatusFilterChange(filter.id)}
                  onMouseEnter={() => setHoveredStatusFilter(filter.id)}
                  onMouseLeave={() => setHoveredStatusFilter(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                  style={
                    statusFilter === filter.id
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: hoveredStatusFilter === filter.id 
                            ? `0 4px 12px ${primary.base}40` 
                            : `0 2px 4px ${primary.base}30`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredStatusFilter === filter.id ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredStatusFilter === filter.id ? `${primary.base}80` : `${primary.base}40`,
                        }
                  }
                >
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Type
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {typeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onTypeFilterChange(filter.id)}
                  onMouseEnter={() => setHoveredTypeFilter(filter.id)}
                  onMouseLeave={() => setHoveredTypeFilter(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                  style={
                    typeFilter === filter.id
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: hoveredTypeFilter === filter.id 
                            ? `0 4px 12px ${primary.base}40` 
                            : `0 2px 4px ${primary.base}30`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredTypeFilter === filter.id ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredTypeFilter === filter.id ? `${primary.base}80` : `${primary.base}40`,
                        }
                  }
                >
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
