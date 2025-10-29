/**
 * AI Filter Bar Component
 * Shared filter bar for AI model management
 * Used in both admin and account contexts
 */

'use client';

import React from 'react';
import type { FilterRoleType, FilterActiveType, SortOrderType, ThemeColors } from '../types/aiManagement';

interface AIFilterBarProps {
  filterRole: FilterRoleType;
  filterActive: FilterActiveType;
  sortBy: 'name' | 'created' | 'role';
  sortOrder: SortOrderType;
  primary: ThemeColors;
  context?: 'admin' | 'account'; // Add context prop
  totalCount: number;
  userCount: number;
  adminCount: number;
  systemCount: number; // Add systemCount
  activeCount: number;
  inactiveCount: number;
  
  setFilterRole: (role: FilterRoleType) => void;
  setFilterActive: (status: FilterActiveType) => void;
  setSortBy: (sort: 'name' | 'created' | 'role') => void;
  setSortOrder: (order: SortOrderType) => void;
}

export default function AIFilterBar({
  filterRole,
  filterActive,
  sortBy,
  sortOrder,
  primary,
  context = 'admin', // Default to admin
  totalCount,
  userCount,
  adminCount,
  systemCount,
  activeCount,
  inactiveCount,
  setFilterRole,
  setFilterActive,
  setSortBy,
  setSortOrder,
}: AIFilterBarProps) {
  // Context-aware filter labels
  const filters = context === 'account' ? [
    { id: 'all' as const, label: 'All', type: 'role', count: totalCount },
    { id: 'user' as const, label: 'Custom', type: 'role', count: userCount },
    { id: 'admin' as const, label: 'Default', type: 'role', count: adminCount },
    { id: 'active' as const, label: 'Active', type: 'status', count: activeCount },
    { id: 'inactive' as const, label: 'Inactive', type: 'status', count: inactiveCount },
  ] : [
    { id: 'all' as const, label: 'All', type: 'role', count: totalCount },
    { id: 'user' as const, label: 'User', type: 'role', count: userCount },
    { id: 'admin' as const, label: 'Admin', type: 'role', count: adminCount },
    { id: 'system' as const, label: 'System', type: 'role', count: systemCount },
    { id: 'active' as const, label: 'Active', type: 'status', count: activeCount },
    { id: 'inactive' as const, label: 'Inactive', type: 'status', count: inactiveCount },
  ];

  const handleFilterClick = (filter: typeof filters[number]) => {
    if (filter.type === 'role') {
      setFilterRole(filter.id as FilterRoleType);
    } else if (filter.type === 'status') {
      // Allow toggling status filters - if clicking the same one, show all
      if (filter.id === 'active') {
        setFilterActive(filterActive === 'active' ? 'all' : 'active');
      } else if (filter.id === 'inactive') {
        setFilterActive(filterActive === 'inactive' ? 'all' : 'inactive');
      }
    }
  };

  const isActive = (filter: typeof filters[number]) => {
    if (filter.type === 'role') {
      return filterRole === filter.id;
    } else if (filter.type === 'status') {
      return filterActive === filter.id;
    }
    return false;
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2 px-4">
      {filters.map((filter) => {
        const active = isActive(filter);
        
        return (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 ${active ? 'shadow-sm hover:shadow-md' : ''}`}
            style={{
              backgroundColor: active ? primary.base : 'transparent',
              color: active ? 'white' : primary.base,
              border: active ? `1px solid ${primary.base}` : 'none',
            }}
          >
            <span>{filter.label}</span>
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: active 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : `${primary.lighter}60`,
                color: active 
                  ? 'white' 
                  : primary.hover || primary.dark,
              }}
            >
              {filter.count}
            </span>
          </button>
        );
      })}
      
      {/* Sort Button */}
      <button
        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap inline-flex items-center gap-2"
        style={{
          backgroundColor: 'transparent',
          color: primary.base,
        }}
        title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sortOrder === 'asc' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          )}
        </svg>
        <span>Sort</span>
      </button>
    </div>
  );
}
