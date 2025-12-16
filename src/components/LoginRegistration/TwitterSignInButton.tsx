'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

interface TwitterSignInButtonProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function TwitterSignInButton({ onSuccess, redirectTo }: TwitterSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useAuthTranslations();

  const handleTwitterSignIn = async () => {
    setIsLoading(true);

    try {
      // Extract locale from current pathname
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : '';

      // Store the intended redirect destination in localStorage
      const finalRedirectUrl = redirectTo || `${window.location.origin}${locale ? `/${locale}` : '/'}`;
      localStorage.setItem('oauth_redirect', finalRedirectUrl);

      console.log('Twitter/X OAuth - final redirect URL stored:', finalRedirectUrl);

      // Use the locale-aware auth callback URL for Supabase OAuth redirect
      // Matches both patterns: https://*.app/*/auth/callback and https://*.app/auth/callback
      const callbackUrl = locale 
        ? `${window.location.origin}/${locale}/auth/callback`
        : `${window.location.origin}/auth/callback`;

      console.log('Twitter/X OAuth - Current origin:', window.location.origin);
      console.log('Twitter/X OAuth - Callback URL:', callbackUrl);
      console.log('Twitter/X OAuth - Locale:', locale);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: callbackUrl,
        },
      });

      console.log('Twitter/X OAuth - Response:', { data, error });

      if (error) {
        console.error('Twitter/X sign-in error:', error);
        return;
      }

      // The redirect will happen automatically
    } catch (err) {
      console.error('Unexpected error during Twitter sign-in:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTwitterSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      type="button"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      <span className="text-sm font-medium">
        {isLoading ? 'Signing in...' : 'Continue with X (Twitter)'}
      </span>
    </button>
  );
}