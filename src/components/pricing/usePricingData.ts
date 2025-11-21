import { useEffect, useState } from 'react';
import { PricingPlan } from '@/types/pricingplan';
import { Feature } from './types';

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

  useEffect(() => {
    const fetchPricingPlans = async () => {
      if (!organizationId) return;
      
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
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching pricing plans:', errorData);
          setPricingPlans([]);
        }
      } catch (error) {
        console.error('Network error fetching pricing plans:', error);
        setPricingPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPricingPlans();
  }, [organizationId, selectedProductId, userCurrency]);

  return { pricingPlans, isLoadingPlans };
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

  useEffect(() => {
    const fetchFeaturesForPlans = async () => {
      if (!pricingPlans.length || !organizationId) return;
      
      setIsLoadingFeatures(true);
      const featuresMap: Record<number, Feature[]> = {};
      
      try {
        // Fetch features for each pricing plan
        for (const plan of pricingPlans) {
          const url = `/api/pricingplan-features?planId=${plan.id}&organizationId=${encodeURIComponent(organizationId)}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const features = await response.json();
            featuresMap[plan.id] = features;
          } else {
            console.error(`Error fetching features for plan ${plan.id}:`, await response.json().catch(() => ({})));
            featuresMap[plan.id] = [];
          }
        }
        
        setPlanFeatures(featuresMap);
      } catch (error) {
        console.error('Network error fetching features:', error);
        setPlanFeatures({});
      } finally {
        setIsLoadingFeatures(false);
      }
    };

    fetchFeaturesForPlans();
  }, [pricingPlans, organizationId]);

  return { planFeatures, isLoadingFeatures };
}
