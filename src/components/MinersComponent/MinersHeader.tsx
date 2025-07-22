'use client';

import React from 'react';
import Tooltip from '@/components/Tooltip';
import Button from '@/ui/Button';
import GroupByDropdown from './GroupByDropdown';
import SortDropdown from './SortDropdown';
import CurrencySwitcher from './CurrencySwitcher';
import { GroupByKey, SortState } from './types';

interface MinersHeaderProps {
  isAuthorized: boolean;
  sortedMinersLength: number;
  isCreatingSample: boolean;
  onCreateSample: () => void;
  groupBy: GroupByKey;
  onGroupByChange: (groupBy: GroupByKey) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

export default function MinersHeader({ 
  isAuthorized, 
  sortedMinersLength, 
  isCreatingSample, 
  onCreateSample,
  groupBy,
  onGroupByChange,
  sort,
  onSortChange
}: MinersHeaderProps) {
  return (
    <div className="relative mb-8 sm:mb-12 w-full">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl"></div>
      <div className="relative p-6 sm:p-8 lg:p-10 w-full">
        {/* Mobile Currency Switcher - Top Line with Icon */}
        <div className="flex justify-between items-center mb-4 sm:hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl">
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <Tooltip 
                content={`Authentication Status: ✅ Authenticated as Admin | Organization: ${isAuthorized ? 'Verified' : 'Checking...'} | Role: Admin Access Granted`}
                variant="info-bottom"
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent cursor-help">
                  Miners Dashboard
                </h1>
              </Tooltip>
              {/* Mobile Status Line - Separate line on mobile */}
              <div className="flex items-center gap-3 mt-3 sm:mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <span className="text-sm sm:text-base text-emerald-700 font-semibold">Live Data</span>
                </div>
                <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                <span className="text-sm sm:text-base text-slate-600 font-medium">Admin Portal</span>
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
              <div className="p-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="p-1.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-100">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        
          {/* Sample Creation Button */}
          {sortedMinersLength === 0 && (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-md opacity-20"></div>
              <Button
                onClick={onCreateSample}
                disabled={isCreatingSample}
                className="relative bg-white/90 backdrop-blur-xl hover:bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 border border-white/20"
              >
                {isCreatingSample ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span>Create Sample Miners</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
