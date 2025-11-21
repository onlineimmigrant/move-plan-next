/**
 * usePricingPlans Hook
 * 
 * Fetches pricing plans associated with products
 */

import { useState, useEffect } from 'react';
import type { PricingPlan } from '@/types/pricingplan';

interface UsePricingPlansProps {
  organizationId: string | null;
}

interface UsePricingPlansReturn {
  pricingPlansByProduct: Record<number, PricingPlan[]>;
  isLoading: boolean;
  error: string | null;
  fetchPricingPlans: () => Promise<void>;
}

export function usePricingPlans({
  organizationId,
}: UsePricingPlansProps): UsePricingPlansReturn {
  const [pricingPlansByProduct, setPricingPlansByProduct] = useState<Record<number, PricingPlan[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricingPlans = async () => {
    if (!organizationId) {
      console.log('No organization ID, skipping fetch');
      setError('Organization ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pricingplans?organization_id=${organizationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch pricing plans');
      }
      
      const data: PricingPlan[] = await response.json();

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
      console.error('Error fetching pricing plans:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPricingPlans();
    }
  }, [organizationId]);

  return {
    pricingPlansByProduct,
    isLoading,
    error,
    fetchPricingPlans,
  };
}
