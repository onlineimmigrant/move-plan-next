'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LocaleAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth Callback - Current URL:', window.location.href);
        console.log('Auth Callback - Origin:', window.location.origin);
        
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          // Get current locale from URL
          const pathParts = window.location.pathname.split('/');
          const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : 'en';
          window.location.href = `/${locale}/login?error=auth_callback_error`;
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

          // Extract locale from the stored redirect URL or current URL
          const url = new URL(redirectTo, window.location.origin);
          const pathParts = url.pathname.split('/');
          const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : null;

          // Get current locale from URL if not in redirect
          const currentPathParts = window.location.pathname.split('/');
          const currentLocale = currentPathParts[1] && currentPathParts[1].length === 2 ? currentPathParts[1] : 'en';

          // If we have a locale and redirectTo is just '/', make it locale-aware
          if ((locale || currentLocale) && redirectTo === '/') {
            redirectTo = `/${locale || currentLocale}/`;
            console.log('Making redirect locale-aware:', redirectTo);
          }

          // Use window.location for immediate redirect
          window.location.href = redirectTo;
        } else {
          // Get current locale from URL
          const pathParts = window.location.pathname.split('/');
          const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : 'en';
          window.location.href = `/${locale}/login?error=no_session`;
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        // Get current locale from URL
        const pathParts = window.location.pathname.split('/');
        const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : 'en';
        window.location.href = `/${locale}/login?error=unexpected_error`;
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}