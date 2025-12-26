import { useState, useMemo, useCallback } from 'react';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { ComparisonViewModel } from '@/types/comparison';
import { trackFeatureSearch } from '../utils/analytics';

export const useComparisonFilters = (
  viewModel: ComparisonViewModel | null,
  competitorFeatureIndex: Map<string, Map<string, any>>,
  sectionId: string
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  const filteredFeatures = useMemo(() => {
    if (!viewModel?.ourFeatures) return [];
    let features = viewModel.ourFeatures;
    
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
  }, [viewModel?.ourFeatures, viewModel?.competitors, viewModel?.config?.features?.filter?.display_on_product, searchQuery, showDifferencesOnly, sectionId, competitorFeatureIndex]);

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
