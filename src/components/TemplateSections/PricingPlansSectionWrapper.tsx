'use client';

import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';
import PricingPlansSlider from './PricingPlansSlider';
import type { PricingPlan } from './PricingPlansSlider';

interface TemplateSectionData {
  id: number;
  section_title?: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  organization_id?: string | null;
}

interface PricingPlansSectionWrapperProps {
  section: TemplateSectionData;
}

export default function PricingPlansSectionWrapper({ section }: PricingPlansSectionWrapperProps) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        // Fetch pricing plans marked for help center (featured/hot offerings)
        const response = await fetch(`/api/pricingplans?organization_id=${organizationId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pricing plans: ${response.status}`);
        }

        const data = await response.json();
        const allPlans = Array.isArray(data) ? data : [];
        
        // Filter for help center plans (featured offerings)
        const featuredPlans = allPlans.filter(plan => plan.is_help_center === true);
        
        setPricingPlans(featuredPlans);
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPricingPlans();
  }, [baseUrl, section.organization_id]);

  // Don't show loading spinner here - parent TemplateSections handles skeleton loading
  // Just return null during loading to avoid duplication
  if (loading) {
    return null;
  }

  if (error) {
    return null; // Silently fail, don't show error to users
  }

  if (pricingPlans.length === 0) {
    return null; // Don't render if no plans available
  }

  return (
    <PricingPlansSlider
      plans={pricingPlans}
      title={section.section_title || 'Hot Offerings'}
      description={section.section_description || 'Special pricing plans just for you'}
    />
  );
}
