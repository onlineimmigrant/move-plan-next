import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Respects prefers-reduced-motion media query
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Get duration for animations respecting reduced motion preference
 * @param normalDuration - Duration in ms for normal animations
 * @param reducedDuration - Duration in ms for reduced motion (default: 0)
 */
export const getAnimationDuration = (
  normalDuration: number,
  reducedDuration: number = 0,
  prefersReducedMotion: boolean
): number => {
  return prefersReducedMotion ? reducedDuration : normalDuration;
};
