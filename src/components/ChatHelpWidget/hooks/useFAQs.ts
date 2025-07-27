// components/ChatHelpWidget/hooks/useFAQs.ts
'use client';
import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import type { FAQ } from '@/types/faq';

export function useFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFAQs() {
      try {
        setLoading(true);
        setError(null);

        // Get organization ID
        const baseUrl = getBaseUrl(true);
        const orgId = await getOrganizationId(baseUrl);
        
        if (!orgId) {
          setError('Organization not found');
          return;
        }

        setOrganizationId(orgId);

        // Fetch FAQs
        const response = await fetch(`/api/faq?organizationId=${orgId}&limit=20`);
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }

        const result = await response.json();
        setFaqs(result.data || []);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load FAQs');
      } finally {
        setLoading(false);
      }
    }

    fetchFAQs();
  }, []);

  return { faqs, loading, error, organizationId };
}
