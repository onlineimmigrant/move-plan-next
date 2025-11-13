/**
 * SiteMapModal - Site structure browser
 * Features: Tree view, statistics, search/filter, keyboard shortcuts
 * Matching HeaderEditModal design patterns (120/100)
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  MapIcon, 
  ChartBarIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSiteMapModal } from './context';
import { 
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  ErrorState,
  EmptyState,
} from '@/components/modals/_shared';
import SiteMapTree from '@/components/SiteManagement/SiteMapTree';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { useSiteMapData } from './hooks/useSiteMapData';
import { StatisticsTab } from './components/StatisticsTab';
import { SearchFilterBar, FilterState } from './components/SearchFilterBar';
import Button from '@/ui/Button';

type TabId = 'tree' | 'statistics';

export default function SiteMapModal() {
  console.log('🗺️ SiteMapModal loaded! (120/100 design)');
  
  const { isOpen, closeModal } = useSiteMapModal();
  const { session } = useSupabaseClient();
  const { organization, isLoading, error, stats, loadOrganization } = useSiteMapData(isOpen);
  
  // Theme colors (matching HeaderEditModal)
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // UI state
  const [currentTab, setCurrentTab] = useState<TabId>('tree');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    priority: [],
    changefreq: [],
  });

  // Keyboard shortcuts (matching HeaderEditModal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + R to refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      // Esc to close modal
      if (e.key === 'Escape') {
        closeModal();
      }
      // 1, 2 for tab switching
      if (e.key === '1') setCurrentTab('tree');
      if (e.key === '2') setCurrentTab('statistics');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadOrganization();
  }, [loadOrganization]);

  // Search and filter handlers
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (!isOpen) return null;

  // Tab configuration
  const tabs = [
    { id: 'tree' as TabId, label: 'Tree View', icon: MapIcon },
    { id: 'statistics' as TabId, label: 'Statistics', icon: ChartBarIcon },
  ];

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={closeModal}
      size="large"
      enableDrag={true}
      enableResize={true}
      ariaLabel="Site Map Modal"
      className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl"
    >
      <StandardModalHeader
        title="Site Map"
        icon={MapIcon}
        iconColor={primary.base}
        onClose={closeModal}
        className="bg-white/30 dark:bg-gray-800/30 rounded-t-2xl"
      />

      {/* Tab Buttons Panel */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-md whitespace-nowrap"
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: `0 4px 12px ${primary.base}40`,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: hoveredTab === tab.id ? primary.hover : primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: hoveredTab === tab.id ? `${primary.base}80` : `${primary.base}40`,
                      }
                }
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'tree' && stats.total > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                    {stats.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <StandardModalBody className="overflow-visible">
        <div>
          {isLoading ? (
            <div className="space-y-4 animate-pulse p-6">
              {/* Skeleton for Search/Filter Bar */}
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              
              {/* Skeleton for Tree */}
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ml-6"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ml-6"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ml-12"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ml-6"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ml-12"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ml-12"></div>
              </div>
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to Load"
              message={error}
              onRetry={loadOrganization}
            />
          ) : organization ? (
            <>
              {/* Tree View Tab */}
              {currentTab === 'tree' && (
                <div className="space-y-4">
                  <SearchFilterBar
                    onSearchChange={handleSearchChange}
                    onFilterChange={handleFilterChange}
                    primaryColor={primary.base}
                  />
                  <SiteMapTree 
                    organization={organization}
                    session={session}
                    compact={true}
                    searchQuery={searchQuery}
                    filters={filters}
                  />
                </div>
              )}

              {/* Statistics Tab */}
              {currentTab === 'statistics' && (
                <StatisticsTab 
                  stats={stats}
                  primaryColor={primary.base}
                />
              )}
            </>
          ) : (
            <EmptyState
              title="Organization Not Found"
              message="No organization data available"
            />
          )}
        </div>
      </StandardModalBody>

      {/* Custom Footer with UI Button */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/30 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <Button
          onClick={handleRefresh}
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ArrowPathIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </StandardModalContainer>
  );
}
