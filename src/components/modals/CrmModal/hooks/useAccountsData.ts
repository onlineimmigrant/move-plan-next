/**
 * useAccountsData Hook
 * 
 * Manages accounts data fetching and state
 */

import { useState, useCallback } from 'react';
import { Profile } from '../types';
import { fetchAccountsWithOrgId } from '@/lib/api/crm';

interface UseAccountsDataProps {
  organizationId?: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function useAccountsData({ organizationId, onToast }: UseAccountsDataProps) {
  const [accounts, setAccounts] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedOrgId, setResolvedOrgId] = useState<string>('');

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchAccountsWithOrgId(organizationId);
    
    if (result.error) {
      onToast(result.error, 'error');
      setIsLoading(false);
      return;
    }

    if (result.data) {
      setAccounts(result.data.accounts);
      setResolvedOrgId(result.data.organizationId);
    }
    setIsLoading(false);
  }, [organizationId, onToast]);

  const refreshAccounts = useCallback(() => {
    return fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    resolvedOrgId,
    fetchAccounts,
    refreshAccounts,
    setAccounts,
  };
}
