/**
 * useTabDataFetching Hook
 * 
 * Manages tab-based data loading for CRM modal to improve performance
 * Only fetches data when a tab becomes active for the first time
 */

import { useEffect, useRef } from 'react';
import type { CrmTab } from '../types';

interface UseTabDataFetchingProps {
  isOpen: boolean;
  activeTab: CrmTab;
  onFetchAccounts: () => Promise<void>;
  onFetchCustomers: () => Promise<void>;
  onFetchLeads: () => Promise<void>;
  onFetchTeamMembers: () => Promise<void>;
  onFetchReviews: () => Promise<void>;
  onFetchTestimonials: () => Promise<void>;
}

/**
 * Handles tab-based data fetching with smart caching
 * Prevents redundant API calls by tracking which tabs have loaded data
 */
export function useTabDataFetching({
  isOpen,
  activeTab,
  onFetchAccounts,
  onFetchCustomers,
  onFetchLeads,
  onFetchTeamMembers,
  onFetchReviews,
  onFetchTestimonials,
}: UseTabDataFetchingProps) {
  // Track which tabs have been loaded
  const loadedTabsRef = useRef<Set<CrmTab>>(new Set());
  
  useEffect(() => {
    if (!isOpen) {
      // Reset loaded tabs when modal closes for fresh data on reopen
      loadedTabsRef.current.clear();
      return;
    }

    // Load data for current tab if not already loaded
    const loadTabData = async () => {
      if (loadedTabsRef.current.has(activeTab)) {
        return; // Already loaded, skip
      }

      try {
        switch (activeTab) {
          case 'accounts':
            await onFetchAccounts();
            break;
          case 'customers':
            await onFetchCustomers();
            break;
          case 'leads':
            await onFetchLeads();
            break;
          case 'team-members':
            await onFetchTeamMembers();
            break;
          case 'reviews':
            await onFetchReviews();
            break;
          case 'testimonials':
            await onFetchTestimonials();
            break;
        }

        loadedTabsRef.current.add(activeTab);
      } catch (error) {
        console.error(`Error loading data for ${activeTab}:`, error);
      }
    };

    loadTabData();
  }, [isOpen, activeTab]);
}
