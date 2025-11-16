/**
 * ProductFilterBar Component
 * 
 * Tabs for filtering products (all/active/archived) with counts
 * Displays product counts for each filter category
 */

'use client';

import React from 'react';

interface ProductFilterBarProps {
  activeTab: 'all' | 'active' | 'archived';
  onTabChange: (tab: 'all' | 'active' | 'archived') => void;
  counts: {
    all: number;
    active: number;
    archived: number;
  };
}

export function ProductFilterBar({
  activeTab,
  onTabChange,
  counts,
}: ProductFilterBarProps) {
  const tabs = [
    { key: 'all' as const, label: 'All Products', count: counts.all },
    { key: 'active' as const, label: 'Active', count: counts.active },
    { key: 'archived' as const, label: 'Archived', count: counts.archived },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-gray-700">
      <nav className="flex gap-1 px-2" aria-label="Product filters">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === tab.key
                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-700/50'
              }
            `}
            aria-current={activeTab === tab.key ? 'page' : undefined}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span
                className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold
                  ${activeTab === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-400'
                  }
                `}
              >
                {tab.count}
              </span>
            </span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
