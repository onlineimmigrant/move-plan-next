import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and manage current user data
 * Extracts Supabase user fetching logic from VideoCallModal
 * 
 * @returns Current user ID and organization ID
 */
export function useCurrentUser() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }

        if (user) {
          setCurrentUserId(user.id);
          
          // Get user's organization
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.warn('Error fetching user profile:', profileError);
          } else if (profile) {
            setCurrentOrgId(profile.organization_id);
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrentUser();
  }, []);

  return {
    currentUserId,
    currentOrgId,
    isLoading,
    error,
  };
}
