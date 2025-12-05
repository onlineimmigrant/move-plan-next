import { useEffect, useState, useRef } from 'react';
import { PricingPlan } from '@/types/pricingplan';
import { Feature } from './types';

// Cache with 5-minute TTL
const CACHE_TTL = 5 * 60 * 1000;
const plansCache = new Map<string, { data: PricingPlan[]; timestamp: number }>();
const featuresCache = new Map<string, { data: Record<number, Feature[]>; timestamp: number }>();

/**
 * Hook to fetch pricing plans from the API
 */
export function usePricingPlans(
  organizationId: string | undefined,
  selectedProductId: number | undefined,
  userCurrency: string
) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingPlans = async () => {
      if (!organizationId) return;
      
      // Check cache first
      const cacheKey = `${organizationId}-${selectedProductId || 'all'}-${userCurrency}`;
      const cached = plansCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setPricingPlans(cached.data);
        setError(null);
        return;
      }
      
      setIsLoadingPlans(true);
      
      try {
        const productParam = selectedProductId ? `&productId=${selectedProductId}` : '';
        const currencyParam = `&currency=${userCurrency}`;
        const url = `/api/pricing-comparison?organizationId=${encodeURIComponent(organizationId)}&type=plans${productParam}${currencyParam}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-currency': userCurrency,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPricingPlans(data);
          setError(null);
          // Cache the result
          plansCache.set(cacheKey, { data, timestamp: Date.now() });
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `Failed to load pricing plans (${response.status})`;
          console.error('Error fetching pricing plans:', errorData);
          setError(errorMessage);
          setPricingPlans([]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.';
        console.error('Network error fetching pricing plans:', error);
        setError(errorMessage);
        setPricingPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPricingPlans();
  }, [organizationId, selectedProductId, userCurrency]);

  return { pricingPlans, isLoadingPlans, error };
}

/**
 * Hook to fetch features for pricing plans
 */
export function usePlanFeatures(
  pricingPlans: PricingPlan[],
  organizationId: string | undefined
) {
  const [planFeatures, setPlanFeatures] = useState<Record<number, Feature[]>>({});
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturesForPlans = async () => {
      if (!pricingPlans.length || !organizationId) return;
      
      // Check cache first
      const planIds = pricingPlans.map(p => p.id).sort().join('-');
      const cacheKey = `${organizationId}-${planIds}`;
      const cached = featuresCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setPlanFeatures(cached.data);
        setError(null);
        return;
      }
      
      setIsLoadingFeatures(true);
      
      try {
        // Parallel fetch all features at once - MUCH FASTER!
        const featurePromises = pricingPlans.map(plan => 
          fetch(`/api/pricingplan-features?planId=${plan.id}&organizationId=${encodeURIComponent(organizationId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
            .then(response => ({ plan, response }))
            .catch(error => ({ plan, error }))
        );
        
        const results = await Promise.all(featurePromises);
        const featuresMap: Record<string, Feature[]> = {};
        
        // Process all responses
        for (const result of results) {
          const planIdKey = String(result.plan.id);
          if ('error' in result) {
            console.error(`Network error for plan ${planIdKey}:`, result.error);
            featuresMap[planIdKey] = [];
          } else if (result.response.ok) {
            const features = await result.response.json();
            featuresMap[planIdKey] = features;
          } else {
            const errorData = await result.response.json().catch(() => ({}));
            console.error(`Error fetching features for plan ${planIdKey}:`, errorData);
            featuresMap[planIdKey] = [];
          }
        }
        
        setPlanFeatures(featuresMap);
        setError(null);
        // Cache the result
        featuresCache.set(cacheKey, { data: featuresMap, timestamp: Date.now() });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error loading features';
        console.error('Network error fetching features:', error);
        setError(errorMessage);
        setPlanFeatures({});
      } finally {
        setIsLoadingFeatures(false);
      }
    };

    fetchFeaturesForPlans();
  }, [pricingPlans, organizationId]);

  return { planFeatures, isLoadingFeatures, error };
}
