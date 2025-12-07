'use client';

import { useMemo } from 'react';

/**
 * Hook for adaptive image optimization based on device type and network conditions
 * 
 * Returns optimal quality and sizes for Next.js Image component
 * Significantly reduces mobile LCP by serving smaller, lower-quality images to mobile devices
 * 
 * @param isPriority - Whether image is critical for LCP (hero, first template section)
 * @returns Object with quality and sizes optimized for current device/network
 * 
 * @example
 * const { quality, sizes } = useOptimizedImage(true);
 * <Image src={src} quality={quality} sizes={sizes} priority />
 */
export function useOptimizedImage(isPriority: boolean = false) {
  // Detect if user is on mobile device
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth < 768;
  }, []);

  // Detect network speed using Network Information API
  const networkSpeed = useMemo(() => {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return 'unknown';
    }
    
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';
    
    // effectiveType: 'slow-2g', '2g', '3g', '4g'
    return connection.effectiveType || 'unknown';
  }, []);

  /**
   * Calculate optimal image quality based on:
   * - Device type (mobile vs desktop)
   * - Network speed (2g, 3g, 4g)
   * - Image priority (LCP vs non-LCP)
   */
  const quality = useMemo(() => {
    // Slow networks get lowest quality
    if (networkSpeed === 'slow-2g' || networkSpeed === '2g') {
      return 60;
    }
    
    // 3G networks get reduced quality
    if (networkSpeed === '3g') {
      return isMobile ? 70 : 75;
    }
    
    // Mobile devices get lower quality even on fast networks
    if (isMobile) {
      return isPriority ? 75 : 70;
    }
    
    // Desktop on fast network gets high quality
    return isPriority ? 85 : 75;
  }, [isMobile, networkSpeed, isPriority]);

  /**
   * Generate responsive sizes attribute for srcset
   * Mobile-first approach with appropriate breakpoints
   */
  const sizes = useMemo(() => {
    if (isMobile) {
      // Mobile: simpler breakpoints, prioritize viewport width
      return '100vw';
    }
    
    // Desktop: more granular control based on layout
    if (isPriority) {
      // LCP images (hero, first section) - larger sizes
      return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px';
    }
    
    // Non-priority images - smaller sizes
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }, [isMobile, isPriority]);

  /**
   * Get srcset widths for responsive images
   * Filtered based on network quality to avoid downloading huge images
   */
  const srcSetWidths = useMemo(() => {
    const allWidths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    
    // On slow networks, limit max image size
    if (networkSpeed === 'slow-2g' || networkSpeed === '2g') {
      return allWidths.filter(w => w <= 828); // Max 828px
    }
    
    if (networkSpeed === '3g') {
      return allWidths.filter(w => w <= 1920); // Max 1920px
    }
    
    // Mobile doesn't need ultra-high-res
    if (isMobile) {
      return allWidths.filter(w => w <= 1920);
    }
    
    return allWidths; // Desktop gets all sizes
  }, [isMobile, networkSpeed]);

  /**
   * Loading strategy based on priority
   */
  const loading = isPriority ? 'eager' : 'lazy';
  const fetchPriority = isPriority ? 'high' : 'auto';

  return {
    quality,
    sizes,
    srcSetWidths,
    loading: loading as 'eager' | 'lazy',
    fetchPriority: fetchPriority as 'high' | 'auto',
    isMobile,
    networkSpeed,
  };
}

/**
 * Utility function to get optimal quality without hook
 * Useful for server-side rendering or non-React contexts
 */
export function getOptimalImageQuality(
  isPriority: boolean,
  isMobile: boolean,
  networkSpeed?: string
): number {
  if (networkSpeed === 'slow-2g' || networkSpeed === '2g') return 60;
  if (networkSpeed === '3g') return isMobile ? 70 : 75;
  if (isMobile) return isPriority ? 75 : 70;
  return isPriority ? 85 : 75;
}
