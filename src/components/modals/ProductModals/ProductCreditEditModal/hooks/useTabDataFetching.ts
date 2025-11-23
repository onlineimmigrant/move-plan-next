/**
 * useTabDataFetching Hook
 * 
 * Manages tab-based data loading to improve performance
 * by only fetching data when a tab becomes active
 */

import { useEffect, useRef } from 'react';
import type { MainTab } from '../components/MainTabNavigation';

interface UseTabDataFetchingProps {
  isOpen: boolean;
  activeTab: MainTab;
  onFetchProductsData: () => Promise<void>;
  onFetchPricingPlansData: () => Promise<void>;
  onFetchFeaturesData: () => Promise<void>;
  onFetchInventoryData: () => Promise<void>;
}

/**
 * Handles tab-based data fetching with smart caching
 * 
 * @param isOpen - Whether the modal is open
 * @param activeTab - Currently active tab
 * @param onFetchProductsData - Callback to fetch products tab data
 * @param onFetchPricingPlansData - Callback to fetch pricing plans tab data
 * @param onFetchFeaturesData - Callback to fetch features tab data
 * @param onFetchInventoryData - Callback to fetch inventory tab data
 * 
 * @example
 * ```tsx
 * useTabDataFetching({
 *   isOpen,
 *   activeTab: mainTab,
 *   onFetchProductsData: async () => {
 *     await productData.fetchProducts();
 *   },
 *   onFetchPricingPlansData: async () => {
 *     await pricingPlansManagementData.fetchPricingPlans();
 *   },
 *   onFetchFeaturesData: async () => {
 *     await pricingPlansData.fetchPricingPlans();
 *     await featuresData.fetchFeatures();
 *     await featuresData.fetchPricingPlanFeatures();
 *   },
 *   onFetchInventoryData: async () => {
 *     await pricingPlansData.fetchPricingPlans();
 *     await inventoryData.fetchInventories();
 *   },
 * });
 * ```
 */
export function useTabDataFetching({
  isOpen,
  activeTab,
  onFetchProductsData,
  onFetchPricingPlansData,
  onFetchFeaturesData,
  onFetchInventoryData,
}: UseTabDataFetchingProps) {
  // Track which tabs have been loaded
  const loadedTabsRef = useRef<Set<MainTab>>(new Set());
  
  useEffect(() => {
    if (!isOpen) {
      // Reset loaded tabs when modal closes
      loadedTabsRef.current.clear();
      return;
    }

    // Load data for current tab if not already loaded
    const loadTabData = async () => {
      if (loadedTabsRef.current.has(activeTab)) {
        return; // Already loaded
      }

      switch (activeTab) {
        case 'products':
          await onFetchProductsData();
          break;
        case 'pricing-plans':
          await onFetchPricingPlansData();
          break;
        case 'features':
          await onFetchFeaturesData();
          break;
        case 'inventory':
          await onFetchInventoryData();
          break;
        case 'stripe':
          // No data fetching needed yet
          break;
      }

      loadedTabsRef.current.add(activeTab);
    };

    loadTabData();
  }, [isOpen, activeTab]);
}
