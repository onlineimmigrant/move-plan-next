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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
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
