'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthStatus {
  isAuthenticated: boolean;
  user: any | null;
  profile: any | null;
  organization: any | null;
  loading: boolean;
  error: string | null;
}

export default function AuthStatusChecker() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    user: null,
    profile: null,
    organization: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setAuthStatus({
            isAuthenticated: false,
            user: null,
            profile: null,
            organization: null,
            loading: false,
            error: userError?.message || 'Not authenticated'
          });
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, organization_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          setAuthStatus({
            isAuthenticated: true,
            user,
            profile: null,
            organization: null,
            loading: false,
            error: `Profile error: ${profileError?.message || 'No profile found'}`
          });
          return;
        }

        // Get organization info
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .select('id, type')
          .eq('id', profile.organization_id)
          .single();

        setAuthStatus({
          isAuthenticated: true,
          user,
          profile,
          organization,
          loading: false,
          error: orgError ? `Organization error: ${orgError.message}` : null
        });

      } catch (error) {
        setAuthStatus({
          isAuthenticated: false,
          user: null,
          profile: null,
          organization: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        checkAuthStatus();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (authStatus.loading) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <strong>🔍 Checking authentication status...</strong>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded border ${
      authStatus.isAuthenticated 
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700'
    }`}>
      <h3 className="font-bold mb-2">
        {authStatus.isAuthenticated ? '✅ Authentication Status' : '❌ Authentication Status'}
      </h3>
      
      {authStatus.isAuthenticated ? (
        <div className="space-y-2 text-sm">
          <p><strong>User ID:</strong> {authStatus.user?.id}</p>
          <p><strong>Email:</strong> {authStatus.user?.email}</p>
          {authStatus.profile && (
            <p><strong>Role:</strong> {authStatus.profile.role}</p>
          )}
          {authStatus.organization && (
            <>
              <p><strong>Organization ID:</strong> {authStatus.organization.id}</p>
              <p><strong>Organization Type:</strong> {authStatus.organization.type}</p>
            </>
          )}
          {authStatus.error && (
            <p className="text-red-600"><strong>Warning:</strong> {authStatus.error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <p><strong>Status:</strong> Not authenticated</p>
          <p><strong>Error:</strong> {authStatus.error}</p>
          <div className="mt-3">
            <a 
              href="/login" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Login
            </a>
            <a 
              href="/register" 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Register
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
