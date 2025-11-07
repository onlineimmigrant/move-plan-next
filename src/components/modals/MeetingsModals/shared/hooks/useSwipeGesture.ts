/**
 * Custom hook for detecting swipe gestures on touch devices
 * Used for navigating between calendar views on mobile
 * 
 * @param onSwipeLeft - Callback when user swipes left
 * @param onSwipeRight - Callback when user swipes right
 * @param enabled - Whether gesture detection is enabled
 * @returns Touch event handlers
 * 
 * @example
 * ```tsx
 * const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeGesture(
 *   () => goToNextMonth(),
 *   () => goToPrevMonth()
 * );
 * 
 * <div
 *   onTouchStart={handleTouchStart}
 *   onTouchMove={handleTouchMove}
 *   onTouchEnd={handleTouchEnd}
 * >
 *   Calendar content
 * </div>
 * ```
 */

import { useRef, useCallback } from 'react';

export function useSwipeGesture(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  enabled: boolean = true
) {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      touchStartX.current = e.touches[0].clientX;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      touchEndX.current = e.touches[0].clientX;
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}
