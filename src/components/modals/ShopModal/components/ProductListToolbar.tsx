'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Product } from '../types';

interface ProductListToolbarProps {
  products: Product[];
  activeTab: 'all' | 'active' | 'archived';
  onTabChange: (tab: 'all' | 'active' | 'archived') => void;
  filteredCount: number;
  onAddProduct?: () => void;
}

export default function ProductListToolbar({
  products,
  activeTab,
  onTabChange,
  filteredCount,
  onAddProduct,
}: ProductListToolbarProps) {
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const totalCount = products.length;
  const activeCount = products.filter(p => p.is_displayed).length;
  const archivedCount = products.filter(p => !p.is_displayed).length;

  const filters = [
    { id: 'all', label: 'All Products', count: totalCount },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'archived', label: 'Archived', count: archivedCount },
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

        {/* Right side - Add Product button */}
        {onAddProduct && (
          <button
            onClick={onAddProduct}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Filters accordion */}
      {showFiltersAccordion && (
        <div className="border-t border-slate-200/50 p-4 bg-white/30 backdrop-blur-sm space-y-3">
          {/* Display Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Display Status
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onTabChange(filter.id)}
                  onMouseEnter={() => setHoveredFilter(filter.id)}
                  onMouseLeave={() => setHoveredFilter(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                  style={
                    activeTab === filter.id
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
                    activeTab === filter.id
                      ? 'bg-white/25 text-white'
                      : filter.id === 'active'
                      ? 'bg-green-100 text-green-600'
                      : filter.id === 'archived'
                      ? 'bg-gray-100 text-gray-600'
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
