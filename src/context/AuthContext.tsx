'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  organizationId: string | null;
  organizationType: string | null;
  fullName: string | null;
  canonicalProfileId: string | null;
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
  const [canonicalProfileId, setCanonicalProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profileFetched, setProfileFetched] = useState<string | null>(null);
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
      // console.log('Fetching profile for user:', userId);
      
      // First, get the current organization ID based on the domain
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      const currentOrgId = await getOrganizationId(baseUrl);
      // console.log('Current organization ID:', currentOrgId);
      
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

        // For OAuth users, try to find existing profile by email first, then create if it doesn't exist
        if (session?.user && !data) {
          console.log('Attempting to find/create profile for OAuth user:', session.user.email);
          try {
            // Get the organization ID
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
            const organizationId = await getOrganizationId(baseUrl);
            
            // First, check if a profile already exists with the same email in this organization
            const { data: existingProfile, error: existingError } = await supabase
              .from('profiles')
              .select(`
                id,
                role,
                organization_id,
                full_name,
                is_site_creator,
                organizations (
                  type
                )
              `)
              .eq('email', session.user.email)
              .eq('organization_id', organizationId)
              .single();
            
            if (!existingError && existingProfile) {
              console.log('Found existing profile for OAuth user by email:', existingProfile.id);
              
              // Update profile with OAuth metadata if missing
              if ((!existingProfile.full_name || existingProfile.full_name.trim() === '') && 
                  (session.user.user_metadata?.full_name || session.user.user_metadata?.name)) {
                const oauthName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
                await supabase
                  .from('profiles')
                  .update({ full_name: oauthName })
                  .eq('id', existingProfile.id);
                console.log('Updated existing profile with OAuth name:', oauthName);
                existingProfile.full_name = oauthName;
              }
              
              // Check admin rights scoped to current organization
              const userOrgId = existingProfile.organization_id;
              const isAdminRole = existingProfile.role === 'admin' && userOrgId === currentOrgId;
              const isSuperadminRole = existingProfile.role === 'superadmin'; // Superadmins have global access
              
              setIsAdmin(isAdminRole || isSuperadminRole);
              setIsSuperadmin(isSuperadminRole);
              setOrganizationId(userOrgId || null);
              setOrganizationType((existingProfile.organizations as any)?.type || null);
              setFullName(existingProfile.full_name || null);
              setCanonicalProfileId(existingProfile.id); // Set canonical profile ID to existing profile
              setProfileFetched(userId);
              return isAdminRole || isSuperadminRole;
            }
            
            // No existing profile found, create a new one
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                role: 'user', // Default role for OAuth users
                organization_id: organizationId, // Add organization_id
              });

            if (!insertError) {
              console.log('Profile created for OAuth user');
              // Fetch the newly created profile
              const { data: newProfile, error: fetchError } = await supabase
                .from('profiles')
                .select(`
                  id,
                  role,
                  organization_id,
                  full_name,
                  is_site_creator,
                  organizations (
                    type
                  )
                `)
                .eq('email', session.user.email)
                .eq('organization_id', organizationId)
                .single();

              if (!fetchError && newProfile) {
                console.log('New profile fetched:', newProfile.id);
                
                // Check admin rights scoped to current organization
                const userOrgId = newProfile.organization_id;
                const isAdminRole = newProfile.role === 'admin' && userOrgId === currentOrgId;
                const isSuperadminRole = newProfile.role === 'superadmin'; // Superadmins have global access
                
                setIsAdmin(isAdminRole || isSuperadminRole);
                setIsSuperadmin(isSuperadminRole);
                setOrganizationId(userOrgId || null);
                setOrganizationType((newProfile.organizations as any)?.type || null);
                setFullName(newProfile.full_name || null);
                setCanonicalProfileId(newProfile.id); // Set canonical profile ID to new profile
                setProfileFetched(userId);
                return isAdminRole || isSuperadminRole;
              }
            } else {
              console.error('Failed to create profile for OAuth user:', insertError);
            }
          } catch (createErr) {
            console.error('Error creating profile for OAuth user:', createErr);
          }
        }

        setIsAdmin(false);
        setIsSuperadmin(false);
        setOrganizationId(null);
        setOrganizationType(null);
        setFullName(null);
        setCanonicalProfileId(null);
        setProfileFetched(null);
        return false;
      }
      
      // console.log('Profile fetched:', { 
      //   role: data.role, 
      //   organization_id: data.organization_id, 
      //   full_name: data.full_name, 
      //   is_site_creator: data.is_site_creator, 
      //   organization_type: (data.organizations as any)?.type,
      //   current_org_id: currentOrgId
      // });
      
      // Check admin rights scoped to current organization
      const userOrgId = data.organization_id;
      const isAdminRole = data.role === 'admin' && userOrgId === currentOrgId;
      const isSuperadminRole = data.role === 'superadmin'; // Superadmins have global access
      
      setIsAdmin(isAdminRole || isSuperadminRole);
      setIsSuperadmin(isSuperadminRole);
      setOrganizationId(userOrgId || null);
      setOrganizationType((data.organizations as any)?.type || null);
      setFullName(data.full_name || null);
      setCanonicalProfileId(userId); // Set canonical profile ID for regular users
      setProfileFetched(userId); // Mark as fetched
      return isAdminRole || isSuperadminRole;
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
      setCanonicalProfileId(null);
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
          if (!error.message.includes('Auth session missing')) {
            setError(error.message);
          }
          setSession(null);
          return;
        }
        setSession(data.session);
        if (data.session?.user?.id) {
          await fetchProfile(data.session.user.id);
        }
      } catch (err: unknown) {
        console.error('Session fetch failed:', (err as Error).message);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer auth check by 50ms to avoid blocking initial render (reduces Script Evaluation time)
    const timer = setTimeout(initializeSession, 50);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      setSession(newSession);
      if (newSession?.user?.id) {
        fetchProfile(newSession.user.id);
      } else {
        setIsAdmin(false);
        setIsSuperadmin(false);
        setOrganizationId(null);
        setOrganizationType(null);
        setFullName(null);
        setProfileFetched(null);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

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
    () => ({ session, isAdmin, isSuperadmin, organizationId, organizationType, fullName, canonicalProfileId, isLoading, error, setSession, login, logout, supabase, isInGeneralOrganization }),
    [session, isAdmin, isSuperadmin, organizationId, organizationType, fullName, canonicalProfileId, isLoading, error, isInGeneralOrganization]
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