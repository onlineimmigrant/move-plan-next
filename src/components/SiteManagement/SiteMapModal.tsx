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
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSiteMapModal } from '@/context/SiteMapModalContext';
import { 
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  LoadingState,
  ErrorState,
  EmptyState,
  type ModalAction
} from '@/components/modals/_shared';
import SiteMapTree from './SiteMapTree';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { useSiteMapData } from '@/components/modals/SiteMapModal/hooks/useSiteMapData';
import { StatisticsTab } from '@/components/modals/SiteMapModal/components/StatisticsTab';
import { SearchFilterBar, FilterState } from '@/components/modals/SiteMapModal/components/SearchFilterBar';

type TabId = 'tree' | 'statistics' | 'settings';

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
  const [refreshing, setRefreshing] = useState(false);
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
      // 1, 2, 3 for tab switching
      if (e.key === '1') setCurrentTab('tree');
      if (e.key === '2') setCurrentTab('statistics');
      if (e.key === '3') setCurrentTab('settings');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  // Refresh animation (matching HeaderEditModal)
  useEffect(() => {
    if (isOpen) {
      setRefreshing(true);
      const timer = setTimeout(() => setRefreshing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [organization, currentTab, isOpen]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrganization().finally(() => {
      setTimeout(() => setRefreshing(false), 300);
    });
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
    { id: 'settings' as TabId, label: 'Settings', icon: Cog6ToothIcon },
  ];

  const primaryAction: ModalAction = {
    label: "Refresh",
    onClick: handleRefresh,
    variant: 'primary',
    loading: isLoading || refreshing,
    disabled: isLoading || refreshing,
    icon: ArrowPathIcon,
  };

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
        tabs={tabs}
        currentTab={currentTab}
        onTabChange={(tabId) => setCurrentTab(tabId as TabId)}
        badges={[{ id: 'tree', count: stats.total }]}
        onClose={closeModal}
        className="bg-white/30 dark:bg-gray-800/30 rounded-t-2xl"
      />

      <StandardModalBody className="overflow-visible">
        <div className={cn(
          'transition-opacity duration-300',
          refreshing && 'opacity-50'
        )}>
          {isLoading ? (
            <LoadingState 
              message="Loading site structure..." 
              size="lg"
            />
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

              {/* Settings Tab */}
              {currentTab === 'settings' && (
                <div className="text-center py-12">
                  <Cog6ToothIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Settings Coming Soon
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sitemap configuration options will be available here
                  </p>
                </div>
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

      <StandardModalFooter
        primaryAction={primaryAction}
        align="right"
        className="bg-white/30 dark:bg-gray-800/30"
      />
    </StandardModalContainer>
  );
}
