'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  section_config?: {
    maxPlans?: number;
    sortBy?: 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'promotion-first';
    autoPlay?: boolean;
    autoPlayInterval?: number;
  };
}

interface PricingPlansSectionWrapperProps {
  section: TemplateSectionData;
}

// Cache pricing plans to prevent refetching
const plansCache = new Map<string, { plans: PricingPlan[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Skeleton loading component
function PricingSliderSkeleton() {
  return (
    <div className="pb-48 sm:pb-56 lg:pb-64 animate-pulse">
      <div className="pt-8 sm:pt-12 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
        </div>
        <div className="flex gap-6 px-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-xl h-96"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPlansSectionWrapper({ section }: PricingPlansSectionWrapperProps) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Extract configuration from section
  const config = useMemo(() => ({
    maxPlans: section.section_config?.maxPlans || undefined,
    sortBy: section.section_config?.sortBy || 'default',
    autoPlay: section.section_config?.autoPlay || false,
    autoPlayInterval: section.section_config?.autoPlayInterval || 5000,
  }), [section.section_config]);

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
        
        if (featuredPlans.length === 0) {
          console.warn('No featured pricing plans found (is_help_center = true)');
        }
        
        // Cache the result
        plansCache.set(organizationId, {
          plans: featuredPlans,
          timestamp: Date.now(),
        });
        
        setPricingPlans(featuredPlans);
        setError(null);
        setRetryCount(0);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pricing plans';
        setError(errorMessage);
        
        // Retry logic (max 3 attempts)
        if (retryCount < 3) {
          console.log(`Retrying... Attempt ${retryCount + 1}/3`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            hasLoadedRef.current = false;
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          hasLoadedRef.current = true;
        }
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
  }, [baseUrl, section.organization_id, retryCount]);

  // Show loading skeleton
  if (loading) {
    return <div ref={containerRef}><PricingSliderSkeleton /></div>;
  }

  // Show retry option on error
  if (error && retryCount >= 3) {
    return (
      <div ref={containerRef} className="pb-48 sm:pb-56 lg:pb-64">
        <div className="pt-8 sm:pt-12 max-w-7xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
            <p className="text-red-600 mb-4">Failed to load pricing plans</p>
            <button
              onClick={() => {
                setRetryCount(0);
                hasLoadedRef.current = false;
                setError(null);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
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
        maxPlans={config.maxPlans}
        sortBy={config.sortBy as any}
        autoPlay={config.autoPlay}
        autoPlayInterval={config.autoPlayInterval}
        onPlanView={(plan) => {
          // Analytics tracking
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'view_item', {
              currency: plan.currency,
              value: plan.is_promotion && plan.promotion_price ? plan.promotion_price / 100 : plan.price / 100,
              items: [{
                item_id: plan.id,
                item_name: plan.product_name || plan.package,
                price: plan.is_promotion && plan.promotion_price ? plan.promotion_price / 100 : plan.price / 100,
              }]
            });
          }
        }}
      />
    </div>
  );
}
