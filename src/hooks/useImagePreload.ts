/**
 * useImagePreload Hook
 * 
 * Preloads next image in a carousel/slider for better UX
 * Automatically manages link element lifecycle
 */
'use client';

import { useEffect } from 'react';
import { isVideoUrl } from '@/utils/videoHelpers';

/**
 * Preload the next image in a carousel
 * 
 * @param imageUrl - URL of image to preload
 * @param shouldPreload - Whether preloading is enabled
 * 
 * @example
 * ```tsx
 * useImagePreload(nextSlideImage, section.is_slider && totalItems > 1);
 * ```
 */
export function useImagePreload(imageUrl: string | undefined | null, shouldPreload: boolean = true) {
  useEffect(() => {
    if (!shouldPreload || !imageUrl || isVideoUrl(imageUrl)) {
      return;
    }
    
    // Create preload link element
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageUrl;
    document.head.appendChild(link);
    
    // Cleanup: remove link when component unmounts or image changes
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [imageUrl, shouldPreload]);
}

/**
 * Preload multiple images
 * 
 * @param imageUrls - Array of image URLs to preload
 * @param shouldPreload - Whether preloading is enabled
 */
export function useMultiImagePreload(imageUrls: readonly (string | undefined | null)[], shouldPreload: boolean = true) {
  useEffect(() => {
    if (!shouldPreload) return;
    
    const links = imageUrls
      .filter((url): url is string => Boolean(url) && !isVideoUrl(url || ''))
      .map(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
        return link;
      });
    
    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [imageUrls, shouldPreload]);
}
