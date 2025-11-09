import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

interface UseAccountAuthReturn {
  accessToken: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Shared authentication hook for account pages
 * Handles session management, token refresh, and redirects
 */
export function useAccountAuth(): UseAccountAuthReturn {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Failed to fetch session: ${sessionError.message}`);
        }

        if (session) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
        } else {
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            throw new Error('No active session found. Please log in.');
          }
          
          setAccessToken(refreshData.session.access_token);
          setUserId(refreshData.session.user.id);
        }
      } catch (err) {
        logger.error('useAccountAuth error:', err);
        setError((err as Error).message);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  return { accessToken, userId, isLoading, error };
}
