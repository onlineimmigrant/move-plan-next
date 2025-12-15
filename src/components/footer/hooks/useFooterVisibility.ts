import { useState, useEffect, useRef } from 'react';

/**
 * Manages footer visibility using IntersectionObserver and deferred rendering
 * Optimizes CLS by only rendering footer when in viewport and after initial page load
 */
export const useFooterVisibility = () => {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  // IntersectionObserver: Only render footer when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, no need to observe anymore
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Defer footer rendering to prevent CLS on pages with minimal content
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const handle = requestIdleCallback(() => setIsReady(true), { timeout: 100 });
        return () => cancelIdleCallback(handle);
      } else {
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return {
    isReady,
    isVisible,
    footerRef,
  };
};
