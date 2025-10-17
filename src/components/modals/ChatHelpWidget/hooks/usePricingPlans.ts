// components/ChatHelpWidget/hooks/usePricingPlans.ts
'use client';
import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';

export interface PricingPlan {
  id: string;
  created_at: string;
  product_id: string;
  product_name?: string;
  package?: string;
  measure?: string;
  price: number;
  currency: string;
  currency_symbol: string;
  is_promotion?: boolean;
  promotion_price?: number;
  promotion_percent?: number;
  recurring_interval?: string;
  recurring_interval_count?: number;
  description?: string;
  links_to_image?: string;
  slug?: string;
  product_slug?: string;
  type?: string;
  is_active: boolean;
  is_help_center?: boolean;
  organization_id: string;
}

export function usePricingPlans(helpCenterOnly: boolean = false) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricingPlans() {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const organizationId = await getOrganizationId(baseUrl);
        
        if (!organizationId) {
          throw new Error('Organization not found');
        }

        const url = `/api/pricingplans?organization_id=${organizationId}`;

        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch pricing plans`);
        }

        const data = await response.json();
        const allPlans = Array.isArray(data) ? data : [];
        
        // Filter client-side if helpCenterOnly is true
        const filteredPlans = helpCenterOnly 
          ? allPlans.filter(plan => plan.is_help_center === true)
          : allPlans;
        
        setPricingPlans(filteredPlans);
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing plans');
        setPricingPlans([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPricingPlans();
  }, [helpCenterOnly]);

  return { pricingPlans, loading, error };
}
