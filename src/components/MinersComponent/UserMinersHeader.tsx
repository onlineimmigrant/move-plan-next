'use client';

import React from 'react';
import Tooltip from '@/components/Tooltip';
import GroupByDropdown from './GroupByDropdown';
import SortDropdown from './SortDropdown';
import CurrencySwitcher from './CurrencySwitcher';
import { GroupByKey, SortState } from './types';

interface UserMinersHeaderProps {
  sortedMinersLength: number;
  groupBy: GroupByKey;
  onGroupByChange: (groupBy: GroupByKey) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

export default function UserMinersHeader({ 
  sortedMinersLength,
  groupBy,
  onGroupByChange,
  sort,
  onSortChange
}: UserMinersHeaderProps) {
  return (
    <div className="relative mb-8 sm:mb-12 w-full">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl"></div>
      <div className="relative p-6 sm:p-8 lg:p-10 w-full">
        {/* Mobile Currency Switcher - Top Line with Icon */}
        <div className="flex justify-between items-center mb-4 sm:hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <CurrencySwitcher />
        </div>

        {/* Top Row - Title and Currency Switcher (Desktop) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative hidden sm:block">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative p-3 sm:p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <Tooltip 
                content={`Personal Miners Dashboard | Viewing: ${sortedMinersLength} miners | Real-time monitoring enabled`}
                variant="info-bottom"
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent cursor-help">
                  My Miners
                </h1>
              </Tooltip>
              {/* Mobile Status Line - Separate line on mobile */}
              <div className="flex items-center gap-3 mt-3 sm:mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <span className="text-sm sm:text-base text-emerald-700 font-semibold">Live Data</span>
                </div>
                <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                <span className="text-sm sm:text-base text-slate-600 font-medium">Personal Dashboard</span>
                {sortedMinersLength > 0 && (
                  <>
                    <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                    <span className="text-sm sm:text-base text-slate-600 font-medium">
                      {sortedMinersLength} {sortedMinersLength === 1 ? 'Miner' : 'Miners'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Currency Switcher - Desktop Only */}
          <div className="hidden sm:flex flex-shrink-0">
            <CurrencySwitcher />
          </div>
        </div>

        {/* Bottom Row - Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          {/* Group By and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H9m8 8H7m6 4H5" />
                </svg>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Group By</label>
                <GroupByDropdown
                  groupBy={groupBy}
                  onGroupByChange={onGroupByChange}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort By</label>
                <SortDropdown
                  sort={sort}
                  onSortChange={onSortChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
