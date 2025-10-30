'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Session, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
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
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationType, setOrganizationType] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileFetched, setProfileFetched] = useState<string | null>(null); // Track which user's profile was fetched
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Pages that require authentication
   */
  const protectedRoutes = ['/account', '/admin'];

  /**
   * Check if current path requires authentication
   */
  const isProtectedRoute = (path: string): boolean => {
    const cleanPath = path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    return protectedRoutes.some(route => cleanPath.startsWith(route));
  };

  const fetchProfile = async (userId: string) => {
    // Avoid fetching the same profile multiple times
    if (profileFetched === userId) {
      console.log('Profile already fetched for user:', userId);
      return isAdmin;
    }

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
        // Don't log error for common cases (e.g., no profile exists yet, network issues during dev)
        if (error && 
            !error.message.includes('JSON object requested') &&
            !error.message.includes('Failed to fetch') &&
            !error.message.includes('Network request failed')) {
          console.error('Profile fetch error:', error?.message || 'No profile found');
        }
        setIsAdmin(false);
        setIsSuperadmin(false);
        setOrganizationId(null);
        setOrganizationType(null);
        setFullName(null);
        return false;
      }
      console.log('Profile fetched:', { role: data.role, organization_id: data.organization_id, full_name: data.full_name, is_site_creator: data.is_site_creator, organization_type: (data.organizations as any)?.type });
      setIsAdmin(data.role === 'admin' || data.role === 'superadmin');
      setIsSuperadmin(data.role === 'superadmin');
      setOrganizationId(data.organization_id || null);
      setOrganizationType((data.organizations as any)?.type || null);
      setFullName(data.full_name || null);
      setProfileFetched(userId); // Mark as fetched
      return data.role === 'admin' || data.role === 'superadmin';
    } catch (err: unknown) {
      const errorMessage = (err as Error).message;
      // Only log unexpected errors (ignore network timeouts during dev)
      if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('Network request failed')) {
        console.error('Profile fetch failed:', errorMessage);
      }
      setIsAdmin(false);
      setIsSuperadmin(false);
      setOrganizationId(null);
      setOrganizationType(null);
      setFullName(null);
      setProfileFetched(null); // Clear fetched marker
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
          // Don't set error for "Auth session missing" - it's normal for logged out users
          if (!error.message.includes('Auth session missing')) {
            setError(error.message);
          }
          setSession(null);
          return;
        }
        setSession(data.session);
        console.log('Initial session:', data.session?.user?.email);
        if (data.session?.user?.id) {
          await fetchProfile(data.session.user.id);
          // Let layouts handle their own redirects
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
      if (newSession?.user?.id) {
        fetchProfile(newSession.user.id);
        // Let layouts handle their own redirects
      } else {
        // Clear profile data on logout
        setIsAdmin(false);
        setIsSuperadmin(false);
        setOrganizationId(null);
        setOrganizationType(null);
        setFullName(null);
        setProfileFetched(null);
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
      setIsSuperadmin(false);
      setOrganizationId(null);
      setOrganizationType(null);
      setFullName(null);
      
      // Clear any auth-related local storage
      localStorage.removeItem('rememberMe');
      
      console.log('Cookies after logout:', document.cookie);
      
      // Smart redirect: stay on current page if public, go to home if protected
      const redirectUrl = pathname && !isProtectedRoute(pathname) ? pathname : '/';
      console.log('Redirecting after logout to:', redirectUrl);
      router.push(redirectUrl);
    } finally {
      setIsLoading(false);
    }
  }

  const isInGeneralOrganization = useMemo(() => organizationType === 'general', [organizationType]);

  const contextValue = useMemo(
    () => ({ session, isAdmin, isSuperadmin, organizationId, organizationType, fullName, isLoading, error, setSession, login, logout, supabase, isInGeneralOrganization }),
    [session, isAdmin, isSuperadmin, organizationId, organizationType, fullName, isLoading, error, isInGeneralOrganization]
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