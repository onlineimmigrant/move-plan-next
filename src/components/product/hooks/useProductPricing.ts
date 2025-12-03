/**
 * Product Pricing Data Hook
 * Handles pricing plan data loading and currency management
 * Pattern inspired by Meetings modal architecture
 */

import { useState, useCallback, useEffect } from 'react';

interface PricingPlan {
  id: number;
  package?: string;
  price: number;
  currency: string;
  currency_symbol: string;
  computed_price?: number;
  computed_currency_symbol?: string;
  [key: string]: any;
}

export function useProductPricing(productId?: number, organizationId?: string) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPricingPlans = useCallback(async () => {
    if (!productId || !organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/pricingplans?product_id=${productId}&organization_id=${organizationId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load pricing plans');
      }

      const data = await response.json();
      setPricingPlans(data.plans || data || []);
    } catch (err) {
      console.error('Error loading pricing plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  }, [productId, organizationId]);

  useEffect(() => {
    loadPricingPlans();
  }, [loadPricingPlans]);

  const refreshPlans = useCallback(() => {
    loadPricingPlans();
  }, [loadPricingPlans]);

  return {
    pricingPlans,
    loading,
    error,
    refreshPlans,
  };
}
