/**
 * FilterPanel Component
 * 
 * Reusable collapsible filter panel with dropdown selectors
 * Used across CRM views for consistent filtering UI
 */

'use client';

import React from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface FilterPanelProps {
  filters: FilterGroup[];
  isOpen: boolean;
  onToggle: () => void;
  hoveredFilter: string | null;
  onHoverFilter: (filterId: string | null) => void;
  primaryColor?: string;
  primaryHover?: string;
}

export function FilterPanel({ 
  filters, 
  isOpen, 
  onToggle, 
  hoveredFilter, 
  onHoverFilter,
  primaryColor = '#3b82f6',
  primaryHover = '#2563eb'
}: FilterPanelProps) {
  // Calculate total count for display
  // Find the first filter with count data
  const firstFilterWithCount = filters.find(f => f.options.some(opt => opt.count !== undefined));
  const totalCount = firstFilterWithCount?.options.find(opt => opt.value === 'all')?.count || 
                     firstFilterWithCount?.options.reduce((sum, opt) => sum + (opt.count || 0), 0) || 
                     0;
  
  const filteredCount = filters.reduce((sum, filter) => {
    const selected = filter.options.find(opt => opt.value === filter.value);
    return selected?.count !== undefined ? selected.count : sum;
  }, totalCount);

  // Hide count badge if no counts are provided
  const showCounts = filters.some(f => f.options.some(opt => opt.count !== undefined));

  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm shadow-sm border w-full sm:w-auto"
        style={{
          color: isOpen ? 'white' : primaryColor,
          background: isOpen 
            ? `linear-gradient(135deg, ${primaryColor}, ${primaryHover})` 
            : '#f3f4f6',
          borderColor: isOpen ? primaryColor : '#e5e7eb',
        }}
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span>Filters</span>
        {showCounts && (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: isOpen ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
              color: isOpen ? 'white' : primaryColor,
            }}
          >
            {filteredCount}/{totalCount}
          </span>
        )}
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 sm:left-0 sm:right-auto bottom-full mb-2 sm:mb-0 border border-gray-200 dark:border-gray-700 bg-white/98 dark:bg-gray-800/98 backdrop-blur-md rounded-2xl sm:rounded-t-2xl shadow-2xl z-50 sm:min-w-[500px]">
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {filters.map((filter) => (
              <div key={filter.id}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {filter.label}
                </label>
                <div className="flex gap-2 flex-wrap justify-start">
                  {filter.options.map((option) => {
                    const isSelected = filter.value === option.value;
                    const isHovered = hoveredFilter === `${filter.id}-${option.value}`;
                    
                    return (
                      <button
                        key={`${filter.id}-${option.value}`}
                        onClick={() => filter.onChange(option.value)}
                        onMouseEnter={() => onHoverFilter(`${filter.id}-${option.value}`)}
                        onMouseLeave={() => onHoverFilter(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                        style={
                          isSelected
                            ? {
                                background: `linear-gradient(135deg, ${primaryColor}, ${primaryHover})`,
                                color: 'white',
                                boxShadow: isHovered 
                                  ? `0 4px 12px ${primaryColor}40` 
                                  : `0 2px 4px ${primaryColor}30`,
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: isHovered ? primaryHover : primaryColor,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: isHovered ? `${primaryColor}80` : `${primaryColor}40`,
                              }
                        }
                      >
                        {option.label}
                        {option.count !== undefined && (
                          <span 
                            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                              color: isSelected ? 'white' : '#6b7280',
                            }}
                          >
                            {option.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
