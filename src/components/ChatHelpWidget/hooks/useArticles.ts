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
  // Help Center fields
  is_help_center?: boolean;
  help_center_order?: number;
}

export function useArticles(helpCenterOnly: boolean = false) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

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

        // Fetch articles with optional Help Center filter
        const params = new URLSearchParams({
          organizationId: orgId,
          limit: helpCenterOnly ? '50' : '1000',
          offset: '0',
        });
        
        if (helpCenterOnly) {
          params.append('helpCenterOnly', 'true');
        }

        const response = await fetch(`/api/articles?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const result = await response.json();
        setArticles(result.data || []);
        setHasMore(result.hasMore || false);
        setTotal(result.total || 0);
        if (result.categoryCounts) {
          setCategoryCounts(result.categoryCounts);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [helpCenterOnly]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !organizationId) return;

    try {
      setLoadingMore(true);

      const params = new URLSearchParams({
        organizationId: organizationId,
        limit: '50',
        offset: articles.length.toString(),
      });
      
      if (helpCenterOnly) {
        params.append('helpCenterOnly', 'true');
      }

      const response = await fetch(`/api/articles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch more articles');
      }

      const result = await response.json();
      setArticles(prev => [...prev, ...(result.data || [])]);
      setHasMore(result.hasMore || false);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('Error loading more articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more articles');
    } finally {
      setLoadingMore(false);
    }
  };

  return { articles, loading, loadingMore, error, organizationId, hasMore, total, loadMore, categoryCounts };
}
