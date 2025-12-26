import { useState, useCallback, useRef } from 'react';
import { ComparisonViewModel } from '@/types/comparison';
import { CachedData } from '../types';
import { CACHE_TTL, CACHE_MAX_SIZE } from '../constants';
import { comparisonAnalytics } from '@/lib/comparisonAnalytics';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Custom hook for fetching and caching comparison data.
 * Includes retry logic, caching with TTL, and analytics tracking.
 * 
 * @param section - The comparison section configuration
 * @param selectedPlanId - Optional plan ID to filter comparison data
 * @param selectedCompetitorIds - Optional array of competitor IDs to include
 * @returns Object containing viewModel, loading state, error state, and fetch functions
 */
export const useComparisonData = (section: any, selectedPlanId: string | null, selectedCompetitorIds: string[] | null) => {
  const [viewModel, setViewModel] = useState<ComparisonViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CachedData>>(new Map());

  const fetchData = useCallback(async (retryCount = 0) => {
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
      // Retry logic for network failures
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, RETRY_DELAY * (retryCount + 1));
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setLoading(false);
      }
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
      // Use requestIdleCallback for non-blocking prefetch
      const prefetchFn = () => {
        fetch(
          `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}${planParam}${competitorParam}`,
          {
            priority: 'low', // Low priority fetch for prefetch
          } as RequestInit
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
      };

      // Use requestIdleCallback if available, otherwise setTimeout
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prefetchFn, { timeout: 2000 });
      } else {
        setTimeout(prefetchFn, 100);
      }
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
