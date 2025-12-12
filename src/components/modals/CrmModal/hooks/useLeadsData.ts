/**
 * useLeadsData Hook
 * 
 * Manages leads data fetching and state
 */

import { useState, useCallback } from 'react';
import { Profile } from '../types';
import { getCurrentOrgId, fetchLeads } from '@/lib/api/crm';

interface UseLeadsDataProps {
  organizationId?: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function useLeadsData({ organizationId, onToast }: UseLeadsDataProps) {
  const [leads, setLeads] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeadsData = useCallback(async () => {
    setIsLoading(true);
    try {
      let orgId = organizationId;
      
      if (!orgId) {
        const result = await getCurrentOrgId();
        if (result.error) {
          onToast(result.error, 'error');
          setIsLoading(false);
          return;
        }
        orgId = result.data!;
      }

      const result = await fetchLeads(orgId);
      
      if (result.error) {
        onToast(result.error, 'error');
      } else {
        setLeads(result.data || []);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      onToast('Failed to load leads', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onToast]);

  const refreshLeads = useCallback(() => {
    return fetchLeadsData();
  }, [fetchLeadsData]);

  return {
    leads,
    isLoading,
    fetchLeadsData,
    refreshLeads,
    setLeads,
  };
}
