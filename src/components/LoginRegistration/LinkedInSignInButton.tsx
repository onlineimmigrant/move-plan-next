'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

interface LinkedInSignInButtonProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function LinkedInSignInButton({ onSuccess, redirectTo }: LinkedInSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useAuthTranslations();

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);

    try {
      // Extract locale from current pathname
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : '';

      // Store the intended redirect destination in localStorage
      const finalRedirectUrl = redirectTo || `${window.location.origin}${locale ? `/${locale}` : '/'}`;
      localStorage.setItem('oauth_redirect', finalRedirectUrl);

      console.log('LinkedIn OAuth - final redirect URL stored:', finalRedirectUrl);

      // Use the locale-aware auth callback URL for Supabase OAuth redirect
      // Matches both patterns: https://*.app/*/auth/callback and https://*.app/auth/callback
      const callbackUrl = locale 
        ? `${window.location.origin}/${locale}/auth/callback`
        : `${window.location.origin}/auth/callback`;

      console.log('LinkedIn OAuth - Current origin:', window.location.origin);
      console.log('LinkedIn OAuth - Callback URL:', callbackUrl);
      console.log('LinkedIn OAuth - Locale:', locale);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: callbackUrl,
        },
      });

      console.log('LinkedIn OAuth - Response:', { data, error });

      if (error) {
        console.error('LinkedIn sign-in error:', error);
        return;
      }

      // The redirect will happen automatically
    } catch (err) {
      console.error('Unexpected error during LinkedIn sign-in:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLinkedInSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      type="button"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      <span className="text-sm font-medium">
        {isLoading ? 'Signing in...' : 'Continue with LinkedIn'}
      </span>
    </button>
  );
}