'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface FeaturesToolbarProps {
  totalCount: number;
  filteredCount: number;
  sortBy: 'name' | 'order' | 'type';
  onSortChange: (sort: 'name' | 'order' | 'type') => void;
  onAddFeature?: () => void;
}

export default function FeaturesToolbar({
  totalCount,
  filteredCount,
  sortBy,
  onSortChange,
  onAddFeature,
}: FeaturesToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [hoveredSort, setHoveredSort] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const sortOptions = [
    { id: 'order', label: 'Custom Order' },
    { id: 'name', label: 'Name (A-Z)' },
    { id: 'type', label: 'Type' },
  ] as const;

  return (
    <div className="border-t border-slate-200/50 bg-white/30 backdrop-blur-sm rounded-b-2xl">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-5 py-3 gap-2">
        {/* Left side - Sort button */}
        <button
          onClick={() => setShowFiltersAccordion(!showFiltersAccordion)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 shadow-sm"
          aria-label="Toggle sort options"
          title="Sort"
          style={{ color: primary.base }}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span>Sort</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/30">
            {filteredCount}/{totalCount}
          </span>
          {showFiltersAccordion ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {/* Right side - Add Feature button */}
        {onAddFeature && (
          <button
            onClick={onAddFeature}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        )}
      </div>

      {/* Sort accordion */}
      {showFiltersAccordion && (
        <div className="border-t border-slate-200/50 p-4 bg-white/30 backdrop-blur-sm space-y-3">
          {/* Sort Options */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Sort By
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSortChange(option.id)}
                  onMouseEnter={() => setHoveredSort(option.id)}
                  onMouseLeave={() => setHoveredSort(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                  style={
                    sortBy === option.id
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: hoveredSort === option.id 
                            ? `0 4px 12px ${primary.base}40` 
                            : `0 2px 4px ${primary.base}30`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredSort === option.id ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredSort === option.id ? `${primary.base}80` : `${primary.base}40`,
                        }
                  }
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
