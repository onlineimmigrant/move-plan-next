/**
 * Shared Focus Trap Hook
 * Traps keyboard focus within a modal or dialog for accessibility
 */

import { useEffect, RefObject } from 'react';

interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocus?: RefObject<HTMLElement>;
  returnFocus?: RefObject<HTMLElement>;
}

export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, initialFocus, returnFocus } = options;

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const container = ref.current;
    const previousActiveElement = document.activeElement as HTMLElement;

    // Focus the initial element or first focusable element
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      // Return focus to previous element
      if (returnFocus?.current) {
        returnFocus.current.focus();
      } else if (previousActiveElement && document.body.contains(previousActiveElement)) {
        previousActiveElement.focus();
      }
    };
  }, [enabled, ref, initialFocus, returnFocus]);
}
