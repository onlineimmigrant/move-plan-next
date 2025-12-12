/**
 * useTeamMembersData Hook
 * 
 * Manages team members data fetching and state
 */

import { useState, useCallback } from 'react';
import { Profile } from '../types';
import { supabase } from '@/lib/supabaseClient';

interface UseTeamMembersDataProps {
  organizationId?: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function useTeamMembersData({ organizationId, onToast }: UseTeamMembersDataProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Get organization ID from user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('No active session');
        setErrorMessage('You are not signed in. Please log in to view team members.');
        setIsLoading(false);
        return;
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      const orgId = organizationId || userProfile?.organization_id || session.user.user_metadata.organization_id;

      if (!orgId) {
        setErrorMessage('No organization found');
        setIsLoading(false);
        return;
      }

      // Fetch team members and all profiles in parallel (optimized)
      const [teamMembersResult, allProfilesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('organization_id', orgId)
          .not('team', 'is', null)
          .eq('team->>is_team_member', 'true'),
        supabase
          .from('profiles')
          .select('id, username, full_name, email, city, postal_code, country, created_at, organization_id, team')
          .eq('organization_id', orgId)
      ]);

      if (teamMembersResult.error) {
        console.error('Error fetching team members:', teamMembersResult.error);
        setErrorMessage('Failed to fetch team members');
      } else {
        setProfiles(teamMembersResult.data || []);
      }

      if (allProfilesResult.error) {
        console.error('Error fetching all profiles:', allProfilesResult.error);
      } else {
        setAllProfiles(allProfilesResult.data || []);
      }
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      if (!errorMessage) {
        setErrorMessage('An error occurred while fetching team members');
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onToast, errorMessage]);

  const refreshTeamMembers = useCallback(() => {
    return fetchTeamMembers();
  }, [fetchTeamMembers]);

  return {
    profiles,
    allProfiles,
    isLoading,
    errorMessage,
    fetchTeamMembers,
    refreshTeamMembers,
    setProfiles,
    setAllProfiles,
  };
}
