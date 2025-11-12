/**
 * ResponsiveWrapper Component
 * 
 * Handles responsive layout for mobile vs desktop
 */

'use client';

import React, { useState, useEffect } from 'react';
import { isMobileViewport } from '../utils/modalSizing';

interface ResponsiveWrapperProps {
  /** Child content to wrap */
  children: (isMobile: boolean) => React.ReactNode;
}

/**
 * Wrapper component that provides mobile detection
 * Renders children with mobile state
 */
export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    setIsMobile(isMobileViewport());

    // Listen for resize
    const handleResize = () => {
      setIsMobile(isMobileViewport());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <>{children(isMobile)}</>;
};
