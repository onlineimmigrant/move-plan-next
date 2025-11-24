'use client';

import React, { useEffect, useState, useRef } from 'react';
import Brands from '@/components/TemplateSections/Brands';
import { getOrganizationId } from '@/lib/supabase';

interface Brand {
  id: string;
  web_storage_address: string;
  name: string;
  organization_id: string | null;
}

interface BrandsSectionProps {
  section: any; // Template section data (unused but consistent with pattern)
}

// Cache brands to prevent refetching
const brandsCache = new Map<string, { brands: Brand[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const BrandsSection: React.FC<BrandsSectionProps> = ({ section }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const fetchBrands = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        // Check cache first
        const cached = brandsCache.get(organizationId);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          setBrands(cached.brands);
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        const response = await fetch(`/api/brands?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Cache the result
          brandsCache.set(organizationId, {
            brands: data,
            timestamp: Date.now(),
          });
          
          setBrands(data);
          hasLoadedRef.current = true;
        } else {
          console.error('Failed to fetch brands:', response.status, response.statusText);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
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
              fetchBrands();
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
  }, [baseUrl]);

  // Don't show loading spinner here - parent TemplateSections handles skeleton loading
  // Just return null during loading to avoid duplication
  if (loading) {
    return <div ref={containerRef} />;
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef}>
      <Brands 
        brands={brands} 
        textContent={{ brands_heading: 'Our Trusted Partners' }} 
      />
    </div>
  );
};

export default BrandsSection;
