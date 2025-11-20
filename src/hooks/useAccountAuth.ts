import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { useAuth } from '@/context/AuthContext';

interface UseAccountAuthReturn {
  accessToken: string | null;
  userId: string | null;
  canonicalProfileId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Shared authentication hook for account pages
 * Handles session management, token refresh, and redirects
 */
export function useAccountAuth(): UseAccountAuthReturn {
  const { session, canonicalProfileId, isLoading, error } = useAuth();

  const accessToken = session?.access_token || null;
  const userId = session?.user?.id || null;

  return { accessToken, userId, canonicalProfileId, isLoading, error };
}
