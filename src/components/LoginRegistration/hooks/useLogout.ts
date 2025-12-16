import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for handling user logout with smart redirect logic
 * 
 * After logout, redirects to:
 * 1. Current page if it's public (doesn't require auth)
 * 2. Home page (/) if current page requires authentication
 */
export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Pages that require authentication
   * User will be redirected to home if they're on these pages when logging out
   */
  const protectedRoutes = [
    '/account',
    '/admin',
  ];

  /**
   * Check if current path requires authentication
   */
  const isProtectedRoute = (path: string): boolean => {
    // Remove locale prefix if present (e.g., /en/account -> /account)
    const cleanPath = path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    
    // Check if path starts with any protected route
    return protectedRoutes.some(route => cleanPath.startsWith(route));
  };

  /**
   * Get redirect URL after logout
   * Returns current page if public, or home page if protected
   */
  const getRedirectUrl = (): string => {
    if (!pathname) return '/';
    
    // If on a protected route, redirect to home
    if (isProtectedRoute(pathname)) {
      return '/';
    }
    
    // Otherwise, stay on current page
    return pathname;
  };

  /**
   * Perform logout and redirect
   */
  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Logout error:', signOutError.message);
        setError(signOutError.message);
        setIsLoading(false);
        return { success: false, error: signOutError.message };
      }

      // Clear any local storage items related to auth
      localStorage.removeItem('rememberMe');

      // Determine redirect URL
      const redirectUrl = getRedirectUrl();
      
      console.log('Logout successful, redirecting to:', redirectUrl);
      
      // Redirect to appropriate page
      router.push(redirectUrl);
      
      setIsLoading(false);
      return { success: true, redirectUrl };

    } catch (err: any) {
      console.error('Logout failed:', err);
      const errorMessage = err.message || 'Logout failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    logout,
    isLoading,
    error,
    clearError,
  };
}

export default useLogout;
