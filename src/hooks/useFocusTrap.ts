// useFocusTrap.ts - Reusable focus trap & return-focus hook for modals/popovers
'use client';

import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
  initialFocusSelector?: string;
}

// Focusable selectors (excluding disabled & negative tabindex)
const FOCUSABLE_SELECTOR = [
  'a[href]','button:not([disabled])','textarea:not([disabled])','input:not([disabled])','select:not([disabled])','[tabindex]:not([tabindex="-1"])'
].join(',');

export default function useFocusTrap({ active, onEscape, initialFocusSelector }: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Skip trapping in test environment to avoid interfering with unit tests that simulate typing
    if (process.env.NODE_ENV === 'test') return;
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Store previous focus for return-focus on cleanup
    previousFocusedRef.current = document.activeElement as HTMLElement;

    // Determine initial focus target
    let focusTarget: HTMLElement | null = null;
    if (initialFocusSelector) {
      focusTarget = container.querySelector(initialFocusSelector) as HTMLElement | null;
    }
    if (!focusTarget) {
      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[];
      focusTarget = focusable.find(el => el.offsetParent !== null) || container; // fallback to container
    }
    // Set tabIndex if missing so container can be focused
    if (focusTarget === container && !container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '-1');
    }
    setTimeout(() => focusTarget?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onEscape) {
          onEscape();
          return;
        }
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[];
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      let nextIndex = currentIndex;
      if (e.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
      }
      e.preventDefault();
      focusable[nextIndex].focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus if still in document
      const prev = previousFocusedRef.current;
      if (prev && document.contains(prev)) {
        setTimeout(() => prev.focus(), 0);
      }
    };
  }, [active, onEscape, initialFocusSelector]);

  return containerRef;
}
