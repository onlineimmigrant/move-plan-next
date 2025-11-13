/**
 * useSiteMapData Hook
 * Business logic for loading organization and sitemap data
 * Optimized with useCallback and proper cleanup
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getOrganizationId } from '@/lib/supabase';
import { Organization } from '@/components/SiteManagement/types';

interface SiteMapStats {
  total: number;
  byPriority: Record<string, number>;
  byChangeFreq: Record<string, number>;
  byType: Record<string, number>;
}

export function useSiteMapData(isOpen: boolean) {
  const { supabase } = useSupabaseClient();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SiteMapStats>({
    total: 0,
    byPriority: {},
    byChangeFreq: {},
    byType: {}
  });

  const loadOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current organization ID using helper
      const baseUrl = window.location.origin;
      const orgId = await getOrganizationId(baseUrl);

      if (!orgId) {
        throw new Error('Organization not found for current domain');
      }

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) {
        console.error('Supabase error:', orgError);
        throw new Error(`Failed to fetch organization: ${orgError.message}`);
      }

      if (!orgData) {
        throw new Error('Organization data not found');
      }
      
      // Type assertion with unknown intermediate for Supabase return type
      const organization = orgData as unknown as Organization;
      setOrganization(organization);
      
      // Load sitemap stats
      await loadSitemapStats(organization);
      
    } catch (err) {
      console.error('Error loading organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const loadSitemapStats = useCallback(async (org: Organization) => {
    try {
      const baseUrl = org.base_url || org.base_url_local || window.location.origin;
      const proxyUrl = `/api/sitemap-proxy?organizationId=${encodeURIComponent(org.id)}&baseUrl=${encodeURIComponent(baseUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const urlElements = xmlDoc.querySelectorAll('url');
      
      // Calculate statistics
      const statsData: SiteMapStats = {
        total: urlElements.length,
        byPriority: {},
        byChangeFreq: {},
        byType: {}
      };

      urlElements.forEach((urlEl) => {
        const priority = urlEl.querySelector('priority')?.textContent || '0.5';
        const changefreq = urlEl.querySelector('changefreq')?.textContent || 'weekly';
        const loc = urlEl.querySelector('loc')?.textContent || '';
        
        // Count by priority
        statsData.byPriority[priority] = (statsData.byPriority[priority] || 0) + 1;
        
        // Count by change frequency
        statsData.byChangeFreq[changefreq] = (statsData.byChangeFreq[changefreq] || 0) + 1;
        
        // Detect type from URL
        let type = 'static';
        if (loc.includes('/blog/')) type = 'blog';
        else if (loc.includes('/products/')) type = 'product';
        else if (loc.includes('/features/')) type = 'feature';
        else if (loc === baseUrl || loc === baseUrl + '/') type = 'home';
        
        statsData.byType[type] = (statsData.byType[type] || 0) + 1;
      });

      setStats(statsData);
    } catch (err) {
      console.error('Error loading sitemap stats:', err);
    }
  }, []);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrganization();
    }
  }, [isOpen, loadOrganization]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOrganization(null);
      setError(null);
      setIsLoading(true);
      setStats({
        total: 0,
        byPriority: {},
        byChangeFreq: {},
        byType: {}
      });
    }
  }, [isOpen]);

  return {
    organization,
    isLoading,
    error,
    stats,
    loadOrganization
  };
}
