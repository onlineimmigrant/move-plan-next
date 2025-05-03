'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

// Log environment variables to debug
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
console.log('Supabase client initialized:', supabase);

interface AuthContextType {
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      console.log('Initial session:', data.session);
      console.log('Cookies after fetching session:', document.cookie);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      const hasChanged =
        newSession?.access_token !== session?.access_token ||
        newSession?.user?.id !== session?.user?.id;

      if (hasChanged) {
        setSession(newSession);
        console.log('Auth state changed:', event, newSession);
        console.log('Cookies after auth state change:', document.cookie);
      } else {
        console.log('Auth state unchanged, skipping session update.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    console.log('Login successful:', data);
    setSession(data.session);
    console.log('Cookies after login:', document.cookie);
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
    setSession(null);
    console.log('Cookies after logout:', document.cookie);
  }

  const contextValue = useMemo(
    () => ({
      session,
      setSession,
      login,
      logout,
      supabase,
    }),
    [session]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}