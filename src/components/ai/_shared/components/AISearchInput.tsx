/**
 * Shared AI Search Input Component
 * Reusable search input with result count and theme color support
 */

'use client';

import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { AIThemeColors } from '../types';

export interface AISearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  primary?: AIThemeColors;
  className?: string;
}

/**
 * AISearchInput Component
 * 
 * Enhanced Apple-style search bar with:
 * - Theme color integration
 * - Result count display
 * - Clear button
 * - Smooth animations
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <AISearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search models..."
 *   resultCount={filteredResults.length}
 *   primary={primary}
 * />
 * ```
 */
export function AISearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  resultCount,
  primary,
  className = '',
}: AISearchInputProps) {
  // Default colors if primary is not provided
  const colors = primary || {
    base: '#0ea5e9',
    light: '#7dd3fc',
    lighter: '#e0f2fe',
  };

  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {/* Enhanced Apple-Style Search Bar */}
      <div className="relative max-w-3xl mx-auto group">
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl"
          style={{ 
            background: `linear-gradient(to right, ${colors.lighter}, white, ${colors.lighter})`
          }}
        />
        
        <div className="relative">
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none z-10">
            <MagnifyingGlassIcon 
              className="h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300"
              style={{ color: value ? colors.base : '#94a3b8' }}
            />
          </div>
          
          {/* Search input */}
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="relative block w-full pl-13 sm:pl-16 pr-20 sm:pr-24 py-4 sm:py-5 bg-slate-50/80 backdrop-blur-sm border-0 rounded-3xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-500 text-base sm:text-lg font-normal hover:bg-slate-100/80"
            style={{
              '--tw-ring-color': `${colors.base}30`,
            } as React.CSSProperties}
          />
          
          {/* Result count and clear button */}
          {value && (
            <div className="absolute inset-y-0 right-0 pr-5 sm:pr-6 flex items-center gap-3">
              {/* Result count badge */}
              {resultCount !== undefined && (
                <span 
                  className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${colors.lighter}40`,
                    color: colors.base 
                  }}
                >
                  {resultCount} {resultCount === 1 ? 'result' : 'results'}
                </span>
              )}
              
              {/* Clear button */}
              <button
                onClick={() => onChange('')}
                className="p-1.5 rounded-full hover:bg-slate-200 transition-colors duration-200"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
