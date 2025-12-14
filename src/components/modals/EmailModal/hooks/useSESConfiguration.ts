'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SESConfig {
  ses_access_key_id: string | null;
  ses_secret_access_key: string | null;
  ses_region: string | null;
  transactional_email: string | null;
  marketing_email: string | null;
}

interface UseSESConfigurationResult {
  config: SESConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: Partial<SESConfig>) => Promise<void>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

export function useSESConfiguration(): UseSESConfigurationResult {
  const [config, setConfig] = useState<SESConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: settings, error: fetchError } = await supabase
        .from('settings')
        .select('ses_access_key_id, ses_secret_access_key, ses_region, transactional_email, marketing_email')
        .eq('organization_id', profile.organization_id)
        .single();

      if (fetchError) throw fetchError;
      setConfig(settings as SESConfig);
    } catch (err) {
      console.error('Error fetching SES configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<SESConfig>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error: updateError } = await supabase
        .from('settings')
        .update(updates)
        .eq('organization_id', profile.organization_id);

      if (updateError) throw updateError;

      await refreshConfig();
    } catch (err) {
      console.error('Error updating SES configuration:', err);
      throw err;
    }
  }, [refreshConfig]);

  const testConnection = useCallback(async () => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/email/ses/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.error || 'Connection test failed',
        };
      }

      return {
        success: true,
        message: result.message || 'SES connection successful',
      };
    } catch (err) {
      console.error('Error testing SES connection:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      };
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  return {
    config,
    isLoading,
    error,
    refreshConfig,
    updateConfig,
    testConnection,
  };
}
