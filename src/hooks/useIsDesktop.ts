import { useState, useEffect } from 'react';

/**
 * Custom hook to detect desktop viewport (>= 768px)
 * Uses MediaQuery API for efficient viewport detection
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    
    // Set initial value
    setIsDesktop(mediaQuery.matches);

    // Only update state if the value actually changes
    const handleResize = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  return isDesktop;
}
