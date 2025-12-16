'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          window.location.href = '/login?error=auth_callback_error';
          return;
        }

        if (data.session) {
          // Successful authentication
          // Get the stored redirect URL, or default based on current page
          let redirectTo = localStorage.getItem('oauth_redirect') || '/account';
          localStorage.removeItem('oauth_redirect');

          console.log('OAuth callback - stored redirect:', redirectTo);

          // Special handling: if user was on /login page, redirect to /
          if (redirectTo.includes('/login')) {
            redirectTo = '/';
            console.log('Redirecting login page user to home:', redirectTo);
          }

          // Extract locale from the stored redirect URL
          const url = new URL(redirectTo, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
          const pathParts = url.pathname.split('/');
          const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : null;

          // If we have a locale and redirectTo is just '/', make it locale-aware
          if (locale && redirectTo === '/') {
            redirectTo = `/${locale}/`;
            console.log('Making redirect locale-aware:', redirectTo);
          }

          // Use window.location for immediate redirect
          window.location.href = redirectTo;
        } else {
          window.location.href = '/login?error=no_session';
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        window.location.href = '/login?error=unexpected_error';
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}