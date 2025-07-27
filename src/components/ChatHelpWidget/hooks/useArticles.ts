// components/ChatHelpWidget/hooks/useArticles.ts
'use client';
import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

export interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  subsection: string; // category
  author_name: string;
  created_on: string;
  readTime: number;
  main_photo?: string;
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
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

        // Fetch articles
        const response = await fetch(`/api/articles?organizationId=${orgId}&limit=50`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const result = await response.json();
        setArticles(result.data || []);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  return { articles, loading, error, organizationId };
}
