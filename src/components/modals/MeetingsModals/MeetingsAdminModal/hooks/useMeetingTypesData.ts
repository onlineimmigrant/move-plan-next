/**
 * useMeetingTypesData Hook
 * 
 * Manages meeting types data for the Admin Modal:
 * - Fetches meeting types from API
 * - Filters active meeting types
 * - Listens for realtime updates
 * - Manages meeting settings
 * 
 * @example
 * ```tsx
 * const {
 *   meetingTypes,
 *   meetingSettings,
 *   loadMeetingTypes
 * } = useMeetingTypesData(organizationId, isOpen);
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MeetingType } from '../../shared/types';

export interface MeetingSettings {
  business_hours_start?: string;
  business_hours_end?: string;
  is_24_hours?: boolean;
}

export interface UseMeetingTypesDataReturn {
  meetingTypes: MeetingType[];
  setMeetingTypes: (types: MeetingType[]) => void;
  meetingSettings: MeetingSettings;
  setMeetingSettings: (settings: MeetingSettings) => void;
  loadMeetingTypes: () => Promise<void>;
}

/**
 * Custom hook to manage meeting types data
 */
export function useMeetingTypesData(
  organizationId: string | undefined,
  isOpen: boolean
): UseMeetingTypesDataReturn {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings>({});

  // Load meeting types
  const loadMeetingTypes = useCallback(async () => {
    if (!isOpen || !organizationId) return;

    try {
      // Load meeting types via API
      const typesResponse = await fetch(`/api/meetings/types?organization_id=${organizationId}`);
      if (!typesResponse.ok) {
        throw new Error('Failed to load meeting types');
      }
      
      const typesData = await typesResponse.json();
      // For admin view, show all active meeting types
      const activeMeetingTypes = (typesData.meeting_types || []).filter(
        (mt: MeetingType) => mt.is_active
      );
      setMeetingTypes(activeMeetingTypes);
    } catch (err) {
      console.error('Error loading meeting types:', err);
      throw err;
    }
  }, [organizationId, isOpen]);

  // Listen for meeting types changes (debounced to prevent excessive reloads)\n  useEffect(() => {\n    if (!isOpen || !organizationId) return;\n\n    let debounceTimer: NodeJS.Timeout;\n    \n    const handleChange = () => {\n      // Debounce reloads to prevent rapid successive calls\n      clearTimeout(debounceTimer);\n      debounceTimer = setTimeout(() => {\n        loadMeetingTypes();\n      }, 500);\n    };\n\n    const channel = supabase\n      .channel(`meeting-types-changes-${organizationId}`)\n      .on('postgres_changes', {\n        event: '*',\n        schema: 'public',\n        table: 'meeting_types',\n        filter: `organization_id=eq.${organizationId}`,\n      }, handleChange)\n      .subscribe();\n\n    return () => {\n      clearTimeout(debounceTimer);\n      supabase.removeChannel(channel);\n    };\n  }, [isOpen, organizationId, loadMeetingTypes]);

  return {
    meetingTypes,
    setMeetingTypes,
    meetingSettings,
    setMeetingSettings,
    loadMeetingTypes,
  };
}
