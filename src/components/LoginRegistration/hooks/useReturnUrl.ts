import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Hook to save the current page URL before navigating to login/register
 * This allows redirecting users back to where they were after authentication
 * 
 * Usage: Call this hook in components that redirect to login
 * Example: useReturnUrl() in a protected route component
 */
export function useReturnUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Don't save if already on auth pages
    const isAuthPage = pathname.includes('/login') || 
                       pathname.includes('/register') || 
                       pathname.includes('/reset-password');
    
    if (!isAuthPage && pathname !== '/') {
      const fullPath = searchParams.toString() 
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      
      console.log('Saving return URL:', fullPath);
      localStorage.setItem('returnUrl', fullPath);
    }
  }, [pathname, searchParams]);
}

/**
 * Manually save a return URL to localStorage
 * Useful when programmatically redirecting to login
 * 
 * @param url - The URL to return to after login (defaults to current page)
 */
export function saveReturnUrl(url?: string) {
  if (url) {
    // Don't save auth pages
    const isAuthPage = url.includes('/login') || 
                       url.includes('/register') || 
                       url.includes('/reset-password');
    
    if (!isAuthPage) {
      console.log('Manually saving return URL:', url);
      localStorage.setItem('returnUrl', url);
    }
  }
}

/**
 * Get the saved return URL from localStorage
 * 
 * @param clearAfterGet - Whether to clear the stored URL after retrieving it (default: true)
 * @returns The saved return URL or null if not found
 */
export function getReturnUrl(clearAfterGet: boolean = true): string | null {
  const returnUrl = localStorage.getItem('returnUrl');
  
  if (returnUrl && clearAfterGet) {
    localStorage.removeItem('returnUrl');
  }
  
  return returnUrl;
}

/**
 * Clear the saved return URL from localStorage
 */
export function clearReturnUrl() {
  localStorage.removeItem('returnUrl');
}
