'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Session, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;
  organizationId: string | null;
  organizationType: string | null;
  fullName: string | null;
  isLoading: boolean;
  error: string | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  supabase: SupabaseClient;
  isInGeneralOrganization: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationType, setOrganizationType] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          role, 
          organization_id, 
          full_name, 
          is_site_creator,
          organizations (
            type
          )
        `)
        .eq('id', userId)
        .single();
      if (error || !data) {
        console.error('Profile fetch error:', error?.message || 'No profile found');
        setIsAdmin(false);
        setOrganizationId(null);
        setOrganizationType(null);
        setFullName(null);
        return false;
      }
      console.log('Profile fetched:', { role: data.role, organization_id: data.organization_id, full_name: data.full_name, is_site_creator: data.is_site_creator, organization_type: (data.organizations as any)?.type });
      setIsAdmin(data.role === 'admin');
      setOrganizationId(data.organization_id || null);
      setOrganizationType((data.organizations as any)?.type || null);
      setFullName(data.full_name || null);
      return data.role === 'admin';
    } catch (err: unknown) {
      console.error('Profile fetch failed:', (err as Error).message);
      setIsAdmin(false);
      setOrganizationId(null);
      setOrganizationType(null);
      setFullName(null);
      return false;
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error.message);
          setError(error.message);
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
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
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
        setOrganizationType(null);
        setFullName(null);
        setError('No session found');
        if (window.location.pathname.startsWith('/admin')) {
          console.log('No session, redirecting to /login');
          router.push('/login?redirectTo=%2Fadmin');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        setError(error.message);
        throw error;
      }
      console.log('Login successful:', data.user?.email);
      setSession(data.session);
      if (data.session?.user?.id) {
        await fetchProfile(data.session.user.id);
      }
      console.log('Cookies after login:', document.cookie);
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        setError(error.message);
        throw error;
      }
      setSession(null);
      setIsAdmin(false);
      setOrganizationId(null);
      setOrganizationType(null);
      setFullName(null);
      console.log('Cookies after logout:', document.cookie);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }

  const isInGeneralOrganization = useMemo(() => organizationType === 'general', [organizationType]);

  const contextValue = useMemo(
    () => ({ session, isAdmin, organizationId, organizationType, fullName, isLoading, error, setSession, login, logout, supabase, isInGeneralOrganization }),
    [session, isAdmin, organizationId, organizationType, fullName, isLoading, error, isInGeneralOrganization]
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