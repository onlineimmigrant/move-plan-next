/**
 * usePrefetchLink Hook
 * Prefetches link URLs on hover/focus for instant navigation
 * Uses Next.js router prefetch for optimized loading
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UsePrefetchLinkOptions {
  /** URL to prefetch */
  url?: string;
  /** Enable prefetch on hover */
  prefetchOnHover?: boolean;
  /** Enable prefetch on focus */
  prefetchOnFocus?: boolean;
  /** Delay before prefetch (ms) */
  delay?: number;
}

export function usePrefetchLink({
  url,
  prefetchOnHover = true,
  prefetchOnFocus = true,
  delay = 100,
}: UsePrefetchLinkOptions) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const prefetchUrl = () => {
    if (!url) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay prefetch slightly to avoid unnecessary fetches
    timeoutRef.current = setTimeout(() => {
      try {
        // Check if URL is internal (starts with / or relative)
        if (url.startsWith('/') || !url.includes('://')) {
          router.prefetch(url);
        }
      } catch (error) {
        // Silently fail - prefetch is enhancement only
        console.debug('[Prefetch] Failed to prefetch:', url);
      }
    }, delay);
  };

  const cancelPrefetch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: prefetchOnHover ? prefetchUrl : undefined,
    onFocus: prefetchOnFocus ? prefetchUrl : undefined,
    onMouseLeave: cancelPrefetch,
    onBlur: cancelPrefetch,
  };
}
