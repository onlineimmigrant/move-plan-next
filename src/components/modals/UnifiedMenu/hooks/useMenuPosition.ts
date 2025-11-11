// useMenuPosition Hook
// Calculates optimal menu position based on viewport and button position

import { useState, useEffect, RefObject } from 'react';
import { CalculatedMenuPosition } from '../types';
import { calculateMenuPosition } from '../utils/positioning';

/**
 * Hook to calculate and manage menu position
 * Recalculates on window resize and when menu opens
 */
export function useMenuPosition(
  buttonRef: RefObject<HTMLButtonElement>,
  isOpen: boolean,
  menuWidth: number = 320,
  menuHeight: number = 400
): CalculatedMenuPosition {
  const [position, setPosition] = useState<CalculatedMenuPosition>({
    direction: 'top',
    style: {},
  });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const newPosition = calculateMenuPosition(buttonRect, menuWidth, menuHeight);
      setPosition(newPosition);
    };

    // Calculate immediately without affecting scroll
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    updatePosition();
    
    // Restore scroll position if it changed
    requestAnimationFrame(() => {
      if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
        window.scrollTo(scrollX, scrollY);
      }
    });

    // Recalculate on resize with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePosition, 100);
    };

    const handleScroll = () => {
      const currentScrollX = window.scrollX || window.pageXOffset;
      const currentScrollY = window.scrollY || window.pageYOffset;
      updatePosition();
      // Prevent menu opening from causing scroll
      requestAnimationFrame(() => {
        window.scrollTo(currentScrollX, currentScrollY);
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [isOpen, buttonRef, menuWidth, menuHeight]);

  return position;
}
