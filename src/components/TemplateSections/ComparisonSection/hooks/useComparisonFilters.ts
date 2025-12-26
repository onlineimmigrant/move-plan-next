import { useState, useMemo, useCallback } from 'react';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { ComparisonViewModel } from '@/types/comparison';
import { trackFeatureSearch } from '../utils/analytics';

/**
 * useComparisonFilters manages search and filter state for comparison features.
 * Optimized with useMemo to prevent unnecessary recalculations.
 */
export const useComparisonFilters = (
  viewModel: ComparisonViewModel | null,
  competitorFeatureIndex: Map<string, Map<string, any>>,
  sectionId: string
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  // Memoize features array to prevent recalculation
  const ourFeatures = useMemo(() => viewModel?.ourFeatures || [], [viewModel?.ourFeatures]);
  const competitors = useMemo(() => viewModel?.competitors || [], [viewModel?.competitors]);
  const filterConfig = useMemo(() => viewModel?.config?.features?.filter, [viewModel?.config?.features?.filter]);

  const filteredFeatures = useMemo(() => {
    if (!ourFeatures.length) return [];
    let features = ourFeatures;
    
    // Filter by display_on_product_card setting
    if (viewModel?.config?.features?.filter?.display_on_product) {
      features = features.filter(feature => feature.display_on_product_card === true);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      features = features.filter(feature => 
        feature.name.toLowerCase().includes(query) ||
        feature.description?.toLowerCase().includes(query)
      );
      
      // Track search
      trackFeatureSearch(sectionId, searchQuery, features.length);
    }
    
    // Filter by differences only
    if (showDifferencesOnly && viewModel?.competitors) {
      features = features.filter(feature => {
        const ourStatus = true;
        const hasAnyDifference = viewModel.competitors.some(competitor => {
          const compFeature = competitorFeatureIndex
            .get(competitor.id)
            ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
          const compStatus = compFeature?.status === 'available';
          return ourStatus !== compStatus;
        });
        return hasAnyDifference;
      });
    }
    
    return features;
  }, [ourFeatures, competitors, filterConfig, searchQuery, showDifferencesOnly, sectionId, competitorFeatureIndex]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    showDifferencesOnly,
    setShowDifferencesOnly,
    filteredFeatures,
    clearSearch,
  };
};
