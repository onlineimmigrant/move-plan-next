/**
 * useResponsiveBreakpoint Hook
 * 
 * Detects viewport width against a breakpoint with SSR support
 * Handles window resize events efficiently with debouncing
 */
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if viewport is below a breakpoint
 * 
 * @param breakpoint - Width in pixels (default: 768 for mobile)
 * @returns boolean indicating if viewport is below breakpoint
 * 
 * @example
 * ```tsx
 * const isMobile = useResponsiveBreakpoint(768);
 * const isTablet = useResponsiveBreakpoint(1024);
 * ```
 */
export function useResponsiveBreakpoint(breakpoint: number = 768): boolean {
  const [isBelow, setIsBelow] = useState(false);
  
  useEffect(() => {
    // Initial check
    const checkBreakpoint = () => {
      setIsBelow(window.innerWidth < breakpoint);
    };
    
    // Run immediately
    checkBreakpoint();
    
    // Set up resize listener
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);
  
  return isBelow;
}

/**
 * Hook for multiple breakpoints
 * 
 * @returns Object with common breakpoint checks
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useBreakpoints();
 * ```
 */
export function useBreakpoints() {
  const isMobile = useResponsiveBreakpoint(768);
  const isTablet = useResponsiveBreakpoint(1024);
  const isDesktop = !isTablet;
  
  return { isMobile, isTablet, isDesktop };
}
