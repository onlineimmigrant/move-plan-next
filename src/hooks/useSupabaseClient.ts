/**
 * useSupabaseClient Hook
 * Provides singleton Supabase client and session management
 * Prevents client recreation on every render
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase as supabaseInstance } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Use the singleton client from supabaseClient.js
const getSupabaseClient = () => {
  return supabaseInstance;
};

export function useSupabaseClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { supabase, session, isLoading: isLoading };
}
