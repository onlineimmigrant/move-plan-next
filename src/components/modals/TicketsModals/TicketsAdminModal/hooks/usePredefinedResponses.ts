import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PredefinedResponse } from '../types';

interface UsePredefinedResponsesProps {
  organizationId: string | null;
}

interface UsePredefinedResponsesReturn {
  predefinedResponses: PredefinedResponse[];
  fetchPredefinedResponses: () => Promise<void>;
}

/**
 * Custom hook to manage predefined ticket responses
 * Handles fetching and caching of template responses for quick replies
 */
export function usePredefinedResponses(
  props: UsePredefinedResponsesProps
): UsePredefinedResponsesReturn {
  const { organizationId } = props;
  
  const [predefinedResponses, setPredefinedResponses] = useState<PredefinedResponse[]>([]);

  /**
   * Fetch predefined responses for the organization
   * Gracefully handles missing table (feature is optional)
   */
  const fetchPredefinedResponses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping predefined responses');
        return;
      }

      if (!organizationId) {
        console.log('No organization ID, skipping predefined responses');
        setPredefinedResponses([]);
        return;
      }

      console.log('Fetching predefined responses for org:', organizationId);
      const { data, error } = await supabase
        .from('tickets_predefined_responses')
        .select('id, order, subject, text')
        .eq('organization_id', organizationId)
        .order('order', { ascending: true });

      if (error) {
        // Table doesn't exist yet - this is expected and optional
        console.log('Predefined responses table not available:', error.message);
        setPredefinedResponses([]);
        return;
      }
      
      console.log('✅ Predefined responses loaded:', data?.length || 0, data);
      setPredefinedResponses(data || []);
    } catch (err) {
      console.error('Error fetching predefined responses:', err);
      setPredefinedResponses([]);
    }
  }, [organizationId]);

  return {
    predefinedResponses,
    fetchPredefinedResponses,
  };
}
