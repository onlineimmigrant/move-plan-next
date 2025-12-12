'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { PricingPlan } from '@/types/pricingplan';

interface PricingPlansToolbarProps {
  pricingPlans: PricingPlan[];
  activeFilter: 'all' | 'active' | 'inactive' | 'promotion';
  onFilterChange: (filter: 'all' | 'active' | 'inactive' | 'promotion') => void;
  filteredCount: number;
  onAddPlan?: () => void;
}

export default function PricingPlansToolbar({
  pricingPlans,
  activeFilter,
  onFilterChange,
  filteredCount,
  onAddPlan,
}: PricingPlansToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const totalCount = pricingPlans.length;
  const activeCount = pricingPlans.filter(p => p.is_active).length;
  const inactiveCount = pricingPlans.filter(p => !p.is_active).length;
  const promotionCount = pricingPlans.filter(p => p.is_promotion).length;

  const filters = [
    { id: 'all', label: 'All Plans', count: totalCount },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'inactive', label: 'Inactive', count: inactiveCount },
    { id: 'promotion', label: 'Promotions', count: promotionCount },
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

        {/* Right side - Add Pricing Plan button */}
        {onAddPlan && (
          <button
            onClick={onAddPlan}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            <Plus className="w-4 h-4" />
            Add Pricing Plan
          </button>
        )}
      </div>

      {/* Filters accordion */}
      {showFiltersAccordion && (
        <div className="border-t border-slate-200/50 p-4 bg-white/30 backdrop-blur-sm space-y-3">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Plan Status
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id)}
                  onMouseEnter={() => setHoveredFilter(filter.id)}
                  onMouseLeave={() => setHoveredFilter(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                  style={
                    activeFilter === filter.id
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: hoveredFilter === filter.id 
                            ? `0 4px 12px ${primary.base}40` 
                            : `0 2px 4px ${primary.base}30`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredFilter === filter.id ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredFilter === filter.id ? `${primary.base}80` : `${primary.base}40`,
                        }
                  }
                >
                  <span>{filter.label}</span>
                  <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                    activeFilter === filter.id
                      ? 'bg-white/25 text-white'
                      : filter.id === 'active'
                      ? 'bg-green-100 text-green-600'
                      : filter.id === 'inactive'
                      ? 'bg-gray-100 text-gray-600'
                      : filter.id === 'promotion'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
