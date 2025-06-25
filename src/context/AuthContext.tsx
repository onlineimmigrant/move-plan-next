'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Session, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;
  organizationId: string | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', userId)
        .single();
      if (error || !data) {
        console.error('Profile fetch error:', error?.message || 'No profile found');
        setIsAdmin(false);
        setOrganizationId(null);
        return false;
      }
      console.log('Profile fetched:', data.role, 'organization_id:', data.organization_id);
      setIsAdmin(data.role === 'admin');
      setOrganizationId(data.organization_id || null);
      return data.role === 'admin';
    } catch (err: unknown) {
      console.error('Profile fetch failed:', (err as Error).message);
      setIsAdmin(false);
      setOrganizationId(null);
      return false;
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error.message);
          return;
        }
        setSession(data.session);
        console.log('Initial session:', data.session?.user?.email);
        if (data.session?.user?.id) {
          const isAdminUser = await fetchProfile(data.session.user.id);
          if (!isAdminUser && window.location.pathname.startsWith('/admin')) {
            console.log('Non-admin detected, redirecting to /login');
            router.push('/login?redirectTo=%2Fadmin');
          }
        }
      } catch (err: unknown) {
        console.error('Session fetch failed:', (err as Error).message);
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      console.log('Auth state changed:', event, newSession?.user?.email);
      console.log('Cookies after auth change:', document.cookie);
      if (newSession?.user?.id) {
        fetchProfile(newSession.user.id).then((isAdminUser) => {
          if (!isAdminUser && window.location.pathname.startsWith('/admin')) {
            console.log('Non-admin detected, redirecting to /login');
            router.push('/login?redirectTo=%2Fadmin');
          }
        });
      } else {
        setIsAdmin(false);
        setOrganizationId(null);
        if (window.location.pathname.startsWith('/admin')) {
          console.log('No session, redirecting to /login');
          router.push('/login?redirectTo=%2Fadmin');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      throw error;
    }
    console.log('Login successful:', data.user?.email);
    setSession(data.session);
    if (data.session?.user?.id) {
      await fetchProfile(data.session.user.id);
    }
    console.log('Cookies after login:', document.cookie);
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      throw error;
    }
    setSession(null);
    setIsAdmin(false);
    setOrganizationId(null);
    console.log('Cookies after logout:', document.cookie);
    router.push('/login');
  }

  const contextValue = useMemo(
    () => ({ session, isAdmin, organizationId, setSession, login, logout, supabase }),
    [session, isAdmin, organizationId]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}