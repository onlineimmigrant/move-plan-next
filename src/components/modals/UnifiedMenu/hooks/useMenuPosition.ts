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

    // Calculate immediately
    updatePosition();

    // Recalculate on resize with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePosition, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updatePosition);
      clearTimeout(timeoutId);
    };
  }, [isOpen, buttonRef, menuWidth, menuHeight]);

  return position;
}
