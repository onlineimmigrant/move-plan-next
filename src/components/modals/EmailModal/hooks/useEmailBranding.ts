'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EmailBranding } from '../types';

interface UseEmailBrandingResult {
  branding: EmailBranding | null;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
  updateBranding: (updates: Partial<EmailBranding>) => Promise<void>;
}

export function useEmailBranding(): UseEmailBrandingResult {
  const [branding, setBranding] = useState<EmailBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBranding = useCallback(async () => {
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

      // Use the get_email_branding RPC function
      const { data, error: rpcError } = await supabase
        .rpc('get_email_branding', { org_id: profile.organization_id });

      if (rpcError) throw rpcError;
      setBranding(data as EmailBranding);
    } catch (err) {
      console.error('Error fetching email branding:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch branding');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBranding = useCallback(async (updates: Partial<EmailBranding>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get current branding
      const { data: settings } = await supabase
        .from('settings')
        .select('email_branding')
        .eq('organization_id', profile.organization_id)
        .single();

      // Merge updates with current branding
      const currentBranding = settings?.email_branding || {};
      const updatedBranding = { ...currentBranding, ...updates };

      // Remove injected fields (primary_color, logo_url) - those are read-only
      delete (updatedBranding as any).primary_color;
      delete (updatedBranding as any).logo_url;

      // Update settings table
      const { error: updateError } = await supabase
        .from('settings')
        .update({ email_branding: updatedBranding })
        .eq('organization_id', profile.organization_id);

      if (updateError) throw updateError;

      await refreshBranding();
    } catch (err) {
      console.error('Error updating email branding:', err);
      throw err;
    }
  }, [refreshBranding]);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  return {
    branding,
    isLoading,
    error,
    refreshBranding,
    updateBranding,
  };
}
