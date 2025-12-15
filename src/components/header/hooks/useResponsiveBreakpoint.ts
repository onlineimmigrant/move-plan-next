import { useState, useEffect, useMemo } from 'react';

interface UseResponsiveBreakpointProps {
  menuItemsCount: number;
}

/**
 * Determines responsive breakpoint based on menu items count
 * Returns tailwind breakpoint class and desktop state
 */
export const useResponsiveBreakpoint = ({ menuItemsCount }: UseResponsiveBreakpointProps) => {
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Determine breakpoint based on menu items
  const responsiveBreakpoint = useMemo(() => {
    if (menuItemsCount > 7) return 'xl';
    if (menuItemsCount > 5) return 'lg';
    return 'md';
  }, [menuItemsCount]);

  // Map breakpoint to pixel value
  const breakpointPx = useMemo(() => {
    switch (responsiveBreakpoint) {
      case 'xl': return 1280;
      case 'lg': return 1024;
      case 'md': return 768;
      default: return 768;
    }
  }, [responsiveBreakpoint]);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= breakpointPx);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, [breakpointPx]);

  return {
    responsiveBreakpoint,
    isDesktop,
  };
};
