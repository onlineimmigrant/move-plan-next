import { useState, useCallback, useRef } from 'react';
import { ComparisonViewModel } from '@/types/comparison';
import { CachedData } from '../types';
import { CACHE_TTL, CACHE_MAX_SIZE } from '../constants';
import { comparisonAnalytics } from '@/lib/comparisonAnalytics';

export const useComparisonData = (section: any, selectedPlanId: string | null, selectedCompetitorIds: string[] | null) => {
  const [viewModel, setViewModel] = useState<ComparisonViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CachedData>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      const planParam = selectedPlanId
        ? `&plan_id=${encodeURIComponent(selectedPlanId)}`
        : '';
      const competitorParam = selectedCompetitorIds && selectedCompetitorIds.length > 0
        ? `&competitor_ids=${encodeURIComponent(selectedCompetitorIds.join(','))}`
        : '';
      const cacheKey = `${section.id}-${section.organization_id}${planParam}${competitorParam}`;

      // Check cache
      const cached = cacheRef.current.get(cacheKey);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        setViewModel(cached.data);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}${planParam}${competitorParam}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load comparison data: ${response.statusText}`);
      }

      const data: ComparisonViewModel = await response.json();
      
      // Update cache
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
      
      // Limit cache size
      if (cacheRef.current.size > CACHE_MAX_SIZE) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }

      setViewModel(data);
      
      // Track comparison view analytics
      comparisonAnalytics.trackComparisonView({
        sectionId: section.id,
        organizationId: section.organization_id,
        competitorCount: data.competitors?.length || 0,
        featureCount: data.ourFeatures?.length || 0,
        mode: data.config?.mode || 'both',
      });
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  }, [section, selectedPlanId, selectedCompetitorIds]);

  const prefetchPlanData = useCallback((planId: string) => {
    const planParam = `&plan_id=${encodeURIComponent(planId)}`;
    const competitorParam = selectedCompetitorIds && selectedCompetitorIds.length > 0
      ? `&competitor_ids=${encodeURIComponent(selectedCompetitorIds.join(','))}`
      : '';
    const cacheKey = `${section.id}-${section.organization_id}${planParam}${competitorParam}`;
    
    // Only prefetch if not already cached
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    if (!cached || (now - cached.timestamp) >= CACHE_TTL) {
      fetch(
        `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}${planParam}${competitorParam}`
      )
        .then(res => res.json())
        .then(data => {
          cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
          if (cacheRef.current.size > CACHE_MAX_SIZE) {
            const firstKey = cacheRef.current.keys().next().value;
            if (firstKey) {
              cacheRef.current.delete(firstKey);
            }
          }
        })
        .catch(() => {
          // Silent fail for prefetch
        });
    }
  }, [section, selectedCompetitorIds]);

  return {
    viewModel,
    loading,
    error,
    fetchData,
    prefetchPlanData,
  };
};
