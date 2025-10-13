'use client';

import React, { useEffect, useState } from 'react';
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

const BrandsSection: React.FC<BrandsSectionProps> = ({ section }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/brands?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setBrands(data);
        } else {
          console.error('Failed to fetch brands:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [baseUrl]);

  // Don't show loading spinner here - parent TemplateSections handles skeleton loading
  // Just return null during loading to avoid duplication
  if (loading) {
    return null;
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <Brands 
      brands={brands} 
      textContent={{ brands_heading: 'Our Trusted Partners' }} 
    />
  );
};

export default BrandsSection;
