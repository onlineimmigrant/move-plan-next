'use client';

import { useState, useEffect, useRef } from 'react';
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

// Cache pricing plans to prevent refetching
const plansCache = new Map<string, { plans: PricingPlan[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function PricingPlansSectionWrapper({ section }: PricingPlansSectionWrapperProps) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const fetchPricingPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setError('Organization not found');
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        // Check cache first
        const cached = plansCache.get(organizationId);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          setPricingPlans(cached.plans);
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        // Fetch pricing plans marked for help center (featured/hot offerings)
        const response = await fetch(`/api/pricingplans?organization_id=${organizationId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch pricing plans: ${response.status}`);
        }

        const data = await response.json();
        const allPlans = Array.isArray(data) ? data : [];
        
        // Filter for help center plans (featured offerings)
        const featuredPlans = allPlans.filter(plan => plan.is_help_center === true);
        
        // Cache the result
        plansCache.set(organizationId, {
          plans: featuredPlans,
          timestamp: Date.now(),
        });
        
        setPricingPlans(featuredPlans);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing plans');
        hasLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    if (!hasLoadedRef.current) {
      // Use IntersectionObserver to only load when visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasLoadedRef.current) {
              fetchPricingPlans();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [baseUrl, section.organization_id]);

  // Don't show loading spinner here - parent TemplateSections handles skeleton loading
  // Just return null during loading to avoid duplication
  if (loading) {
    return <div ref={containerRef} />;
  }

  if (error) {
    return null; // Silently fail, don't show error to users
  }

  if (pricingPlans.length === 0) {
    return null; // Don't render if no plans available
  }

  return (
    <div ref={containerRef}>
      <PricingPlansSlider
        plans={pricingPlans}
        title={section.section_title || 'Hot Offerings'}
        description={section.section_description || 'Special pricing plans just for you'}
      />
    </div>
  );
}
