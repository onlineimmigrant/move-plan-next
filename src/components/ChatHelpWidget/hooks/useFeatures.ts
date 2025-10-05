// components/ChatHelpWidget/hooks/useFeatures.ts
'use client';
import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';

export interface Feature {
  id: string;
  created_at: string;
  name: string;
  feature_image?: string;
  icon?: string;
  content: string | null;
  slug: string;
  display_content: boolean;
  display_on_product: boolean;
  type?: string;
  package?: string;
  description?: string;
  type_display?: string;
  organization_id: string | null;
  is_help_center?: boolean;
}

export function useFeatures(helpCenterOnly: boolean = false) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const organizationId = await getOrganizationId(baseUrl);
        
        if (!organizationId) {
          throw new Error('Organization not found');
        }

        const url = helpCenterOnly 
          ? `/api/features?organization_id=${organizationId}&help_center=true`
          : `/api/features?organization_id=${organizationId}`;

        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch features`);
        }

        const data = await response.json();
        setFeatures(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching features:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch features');
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatures();
  }, [helpCenterOnly]);

  return { features, loading, error };
}
