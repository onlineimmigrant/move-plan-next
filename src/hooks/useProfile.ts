import { useState, useEffect, useCallback } from 'react';

// Profile type definition
export interface Profile {
  id: string;
  uuid: string;
  username: string;
  full_name: string | null;
  created_at: string;
  email: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  role: string | null;
  updated_at: string;
}

/**
 * Custom hook for fetching and managing user profile data
 * @param accessToken - The user's authentication token
 * @returns Profile data, loading state, error state, and refetch function
 */
export function useProfile(accessToken: string | null) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profiles', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      const data: Profile = await response.json();
      setProfile(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchProfile();
  }, [accessToken, fetchProfile]);

  return { profile, setProfile, fetchProfile, isLoading, error };
}
