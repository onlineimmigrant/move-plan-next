import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useAuthTranslations();

  /**
   * Get the redirect URL after successful login
   * Priority:
   * 1. Explicit redirectTo parameter passed to login()
   * 2. redirectTo from URL search params
   * 3. returnUrl from localStorage (page user was on before going to login)
   * 4. Current page if it's public (with special handling for /login → /)
   * 5. Default to /account
   */
  const getRedirectUrl = (explicitRedirectTo?: string): string => {
    console.log('[useLogin] getRedirectUrl called with:', {
      explicitRedirectTo,
      searchParams: searchParams.get('redirectTo'),
      returnUrl: localStorage.getItem('returnUrl'),
      pathname
    });

    // 1. Check explicit parameter
    if (explicitRedirectTo && !isAuthPage(explicitRedirectTo)) {
      console.log('[useLogin] Using explicit redirectTo:', explicitRedirectTo);
      return explicitRedirectTo;
    }

    // 2. Check URL search params
    const urlRedirectTo = searchParams.get('redirectTo');
    if (urlRedirectTo && !isAuthPage(decodeURIComponent(urlRedirectTo))) {
      console.log('[useLogin] Using URL search param redirectTo:', decodeURIComponent(urlRedirectTo));
      return decodeURIComponent(urlRedirectTo);
    }

    // 3. Check localStorage for returnUrl
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl && !isAuthPage(returnUrl)) {
      localStorage.removeItem('returnUrl'); // Clear after use
      console.log('[useLogin] Using localStorage returnUrl:', returnUrl);
      return returnUrl;
    }

    // 4. If currently on a public page (not auth page), stay there
    if (pathname && !isAuthPage(pathname)) {
      // Special case: if user is on /login page, redirect to /
      if (pathname === '/login' || pathname.match(/^\/[a-z]{2}\/login$/)) {
        console.log('[useLogin] User was on login page, redirecting to home: /');
        return '/';
      }
      console.log('[useLogin] Staying on current public page:', pathname);
      return pathname;
    }

    // 5. Default fallback
    console.log('[useLogin] Falling back to default: /account');
    return '/account';
  };

  /**
   * Check if a URL is an auth page (login, register, reset-password)
   * We don't want to redirect back to these pages after login
   */
  const isAuthPage = (url: string): boolean => {
    const cleanUrl = url.replace(/^\/[a-z]{2}(?=\/|$)/, ''); // Remove locale prefix
    return ['/login', '/register', '/reset-password'].some(authPage => 
      cleanUrl === authPage || cleanUrl.startsWith(`${authPage}/`)
    );
  };

  const login = async (formData: LoginFormData, redirectTo?: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError(t.fillAllFields);
      setIsLoading(false);
      return { success: false, error: t.fillAllFields };
    }

    try {
      // Attempt sign-in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        console.error('Login error:', authError.message);
        
        // Handle specific error cases
        if (authError.message.includes('Invalid login credentials')) {
          setError(t.invalidCredentials || 'Invalid email or password');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address');
        } else {
          setError(authError.message);
        }
        
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      // Set session in context
      if (data.session) {
        setSession(data.session);
        setSuccess(t.loginSuccessful || 'Login successful!');

        // Handle "remember me" functionality
        if (formData.rememberMe) {
          // Store preference (session is already persisted by Supabase)
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Redirect after a brief delay
        setTimeout(() => {
          const destination = getRedirectUrl(redirectTo);
          console.log('Login successful, redirecting to:', destination);
          router.push(destination);
        }, 500);

        setIsLoading(false);
        return { success: true, data: data.session };
      }

      // If no session, something went wrong
      setError('Login failed. Please try again.');
      setIsLoading(false);
      return { success: false, error: 'No session created' };

    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.message || t.loginFailed || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return { success: false };
    }

    try {
      // Get the current locale from pathname
      const locale = pathname.split('/')[1];
      const resetUrl = locale && locale.length === 2 
        ? `${window.location.origin}/${locale}/reset-password`
        : `${window.location.origin}/reset-password`;

      console.log('[useLogin] Sending password reset email to:', email, 'with redirectTo:', resetUrl);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (resetError) {
        console.error('[useLogin] Password reset error:', resetError);
        // Provide more user-friendly error messages
        if (resetError.message.includes('rate limit')) {
          setError('Too many attempts. Please try again later.');
        } else if (resetError.message.includes('email')) {
          setError('Unable to send email. Please check your email address and try again.');
        } else {
          setError(resetError.message);
        }
        setIsLoading(false);
        return { success: false, error: resetError.message };
      }

      setSuccess('Password reset email sent. Please check your inbox.');
      setIsLoading(false);
      return { success: true };

    } catch (err: any) {
      console.error('[useLogin] Password reset failed:', err);
      const errorMessage = err.message || 'Failed to send password reset email';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return {
    login,
    resetPassword,
    isLoading,
    error,
    success,
    clearMessages,
  };
}

export default useLogin;
