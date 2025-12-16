/**
 * useOrganizationSettings Hook
 * 
 * Fetches organization settings including language and supported locales
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface OrganizationSettings {
  language?: string;
  supported_locales?: string[];
}

export function useOrganizationSettings(organizationId: string | null) {
  const [settings, setSettings] = useState<OrganizationSettings>({
    language: 'en',
    supported_locales: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[useOrganizationSettings] Fetching settings for organization:', organizationId);

        const { data, error: fetchError } = await supabase
          .from('settings')
          .select('language, supported_locales')
          .eq('organization_id', organizationId)
          .single();

        if (fetchError) throw fetchError;

        console.log('[useOrganizationSettings] Settings fetched:', data);

        setSettings({
          language: data?.language || 'en',
          supported_locales: data?.supported_locales || [],
        });
      } catch (err) {
        console.error('[useOrganizationSettings] Error fetching settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
        // Set defaults on error
        setSettings({
          language: 'en',
          supported_locales: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [organizationId]);

  return { settings, loading, error };
}
