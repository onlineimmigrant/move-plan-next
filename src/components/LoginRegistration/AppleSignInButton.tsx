'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function AppleSignInButton({ onSuccess, redirectTo }: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useAuthTranslations();

  const handleAppleSignIn = async () => {
    setIsLoading(true);

    try {
      // Extract locale from current pathname
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : '';

      // Construct redirect URL to home page with locale if present
      const redirectUrl = redirectTo || `${window.location.origin}${locale ? `/${locale}` : '/'}`;

      console.log('Apple OAuth - redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Apple sign-in error:', error);
        return;
      }

      // The redirect will happen automatically
    } catch (err) {
      console.error('Unexpected error during Apple sign-in:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAppleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      type="button"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <span className="text-sm font-medium">
        {isLoading ? 'Signing in...' : 'Continue with Apple'}
      </span>
    </button>
  );
}