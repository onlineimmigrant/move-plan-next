/**
 * usePricingPlans Hook
 * 
 * Fetches pricing plans associated with products
 * Implements caching to prevent duplicate fetches
 */

import { useState, useEffect, useRef } from 'react';
import type { PricingPlan } from '@/types/pricingplan';

interface UsePricingPlansProps {
  organizationId: string | null;
}

interface UsePricingPlansReturn {
  pricingPlansByProduct: Record<number, PricingPlan[]>;
  allPricingPlans: PricingPlan[];
  isLoading: boolean;
  error: string | null;
  fetchPricingPlans: () => Promise<void>;
}

// Simple in-memory cache with timestamp
const cache = {
  data: null as PricingPlan[] | null,
  timestamp: 0,
  organizationId: null as string | null,
};

const CACHE_DURATION = 60000; // 1 minute

export function usePricingPlans({
  organizationId,
}: UsePricingPlansProps): UsePricingPlansReturn {
  const [pricingPlansByProduct, setPricingPlansByProduct] = useState<Record<number, PricingPlan[]>>({});
  const [allPricingPlans, setAllPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  const fetchPricingPlans = async () => {
    if (!organizationId) {
      console.log('No organization ID, skipping fetch');
      setError('Organization ID is required');
      return;
    }

    // Validate organization ID format
    if (typeof organizationId !== 'string' || organizationId.trim() === '') {
      console.error('Invalid organization ID format:', organizationId);
      setError('Invalid organization ID');
      return;
    }

    // Check if fetch is already in progress
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }

    // Check cache validity
    const now = Date.now();
    const isCacheValid = 
      cache.data !== null &&
      cache.organizationId === organizationId &&
      (now - cache.timestamp) < CACHE_DURATION;

    if (isCacheValid && cache.data) {
      console.log('Using cached pricing plans data');
      
      // Store all pricing plans
      setAllPricingPlans(cache.data);

      // Group pricing plans by product_id
      const grouped = cache.data.reduce((acc: Record<number, PricingPlan[]>, plan: PricingPlan) => {
        if (plan.product_id) {
          if (!acc[plan.product_id]) {
            acc[plan.product_id] = [];
          }
          acc[plan.product_id].push(plan);
        }
        return acc;
      }, {} as Record<number, PricingPlan[]>);

      setPricingPlansByProduct(grouped);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetchInProgressRef.current = true;

    try {
      const url = `/api/pricingplans?organization_id=${organizationId}`;
      console.log('Fetching pricing plans from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      console.log('Pricing plans response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to fetch pricing plans (${response.status})`);
      }
      
      const data: PricingPlan[] = await response.json();
      console.log('Successfully fetched pricing plans:', data?.length || 0);

      // Update cache
      cache.data = data || [];
      cache.timestamp = Date.now();
      cache.organizationId = organizationId;

      // Store all pricing plans
      setAllPricingPlans(data || []);

      // Group pricing plans by product_id (data is already filtered by organization_id on server)
      const grouped = (data || []).reduce((acc: Record<number, PricingPlan[]>, plan: PricingPlan) => {
        if (plan.product_id) {
          if (!acc[plan.product_id]) {
            acc[plan.product_id] = [];
          }
          acc[plan.product_id].push(plan);
        } else {
          console.log('Plan has no product_id:', plan);
        }
        return acc;
      }, {} as Record<number, PricingPlan[]>);

      setPricingPlansByProduct(grouped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pricing plans';
      console.error('Error fetching pricing plans:', {
        error: err,
        message,
        errorType: err instanceof TypeError ? 'TypeError (Network/CORS)' : 'Other',
        organizationId
      });
      
      // Provide more specific error messages
      let userMessage = message;
      if (err instanceof TypeError && err.message === 'fetch failed') {
        userMessage = 'Network error: Unable to connect to pricing plans API. Please check your connection.';
      }
      
      setError(userMessage);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPricingPlans();
    }
  }, [organizationId]);

  return {
    pricingPlansByProduct,
    allPricingPlans,
    isLoading,
    error,
    fetchPricingPlans,
  };
}
