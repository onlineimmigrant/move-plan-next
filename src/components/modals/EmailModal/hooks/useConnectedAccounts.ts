'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EmailAccount } from '../types';

interface UseConnectedAccountsResult {
  accounts: EmailAccount[];
  isLoading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  connectAccount: (provider: 'gmail' | 'outlook') => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  setPrimaryAccount: (accountId: string) => Promise<void>;
  triggerSync: (accountId: string) => Promise<void>;
}

export function useConnectedAccounts(): UseConnectedAccountsResult {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_accounts')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching email accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectAccount = useCallback(async (provider: 'gmail' | 'outlook') => {
    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Request OAuth init from API
      const response = await fetch(`/api/email/oauth/${provider}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize OAuth');
      }

      const { authUrl } = await response.json();

      // Open OAuth in popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for popup close and refresh accounts
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          refreshAccounts();
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkPopup);
        if (!popup.closed) {
          popup.close();
        }
      }, 300000);
    } catch (err) {
      console.error(`Error connecting ${provider}:`, err);
      throw err;
    }
  }, [refreshAccounts]);

  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);

      if (deleteError) throw deleteError;
      
      // Refresh list after deletion
      await refreshAccounts();
    } catch (err) {
      console.error('Error disconnecting account:', err);
      throw err;
    }
  }, [refreshAccounts]);

  const setPrimaryAccount = useCallback(async (accountId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Set all accounts to non-primary
      await supabase
        .from('email_accounts')
        .update({ is_primary: false })
        .eq('organization_id', profile.organization_id);

      // Set selected account as primary
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (updateError) throw updateError;

      await refreshAccounts();
    } catch (err) {
      console.error('Error setting primary account:', err);
      throw err;
    }
  }, [refreshAccounts]);

  const triggerSync = useCallback(async (accountId: string) => {
    try {
      // Update sync status to syncing
      await supabase
        .from('email_accounts')
        .update({ 
          sync_status: 'syncing',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', accountId);

      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call API to trigger sync
      const response = await fetch(`/api/email/sync/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      await refreshAccounts();
    } catch (err) {
      console.error('Error triggering sync:', err);
      
      // Update sync status to error
      await supabase
        .from('email_accounts')
        .update({ 
          sync_status: 'error',
          sync_error: err instanceof Error ? err.message : 'Sync failed'
        })
        .eq('id', accountId);
      
      throw err;
    }
  }, [refreshAccounts]);

  useEffect(() => {
    refreshAccounts();

    // Set up realtime subscription
    const channel = supabase
      .channel('email_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_accounts',
        },
        () => {
          refreshAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAccounts]);

  return {
    accounts,
    isLoading,
    error,
    refreshAccounts,
    connectAccount,
    disconnectAccount,
    setPrimaryAccount,
    triggerSync,
  };
}
