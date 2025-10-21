import { useState, useEffect, useCallback } from 'react';
import { MeetingType } from '../types';

/**
 * Custom hook for managing meeting types data
 * Handles loading, caching, and filtering meeting types
 */
export const useMeetingTypes = (organizationId?: string, isAdmin: boolean = false) => {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetingTypes = useCallback(async () => {
    if (!organizationId) {
      setError('Organization ID not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetings/types?organization_id=${organizationId}`);

      if (!response.ok) {
        throw new Error('Failed to load meeting types');
      }

      const data = await response.json();
      let types = data.meeting_types || [];

      // Filter based on user role and type settings
      if (!isAdmin) {
        // For customers, only show active types marked as customer_choice
        types = types.filter((mt: MeetingType) => mt.is_active && mt.is_customer_choice);
      } else {
        // For admins, show all types but prioritize active ones
        types = types.sort((a: MeetingType, b: MeetingType) => {
          if (a.is_active === b.is_active) return 0;
          return a.is_active ? -1 : 1;
        });
      }

      setMeetingTypes(types);
    } catch (err) {
      console.error('Error loading meeting types:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meeting types');
      setMeetingTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, isAdmin]);

  const refreshMeetingTypes = useCallback(() => {
    loadMeetingTypes();
  }, [loadMeetingTypes]);

  // Load meeting types when organization ID changes
  useEffect(() => {
    if (organizationId) {
      loadMeetingTypes();
    }
  }, [organizationId, loadMeetingTypes]);

  // Listen for meeting types changes (when admin edits them)
  useEffect(() => {
    const handleRefresh = () => {
      refreshMeetingTypes();
    };

    window.addEventListener('refreshMeetingTypes', handleRefresh);
    return () => window.removeEventListener('refreshMeetingTypes', handleRefresh);
  }, [refreshMeetingTypes]);

  const getMeetingTypeById = useCallback((id: string) => {
    return meetingTypes.find(type => type.id === id);
  }, [meetingTypes]);

  const getActiveMeetingTypes = useCallback(() => {
    return meetingTypes.filter(type => type.is_active);
  }, [meetingTypes]);

  const getCustomerChoiceTypes = useCallback(() => {
    return meetingTypes.filter(type => type.is_customer_choice);
  }, [meetingTypes]);

  return {
    meetingTypes,
    isLoading,
    error,
    loadMeetingTypes,
    refreshMeetingTypes,
    getMeetingTypeById,
    getActiveMeetingTypes,
    getCustomerChoiceTypes,
  };
};