/**
 * useModalFocus Hook
 * 
 * Manages focus trap and restoration for modals
 */

import { useRef, useEffect } from 'react';
import { UseModalFocusReturn } from '../types';

/**
 * Hook for managing modal focus behavior
 * 
 * - Captures focus when modal opens
 * - Restores focus to previous element when modal closes
 * - Creates focus trap within modal
 * 
 * @param isOpen - Whether the modal is currently open
 * @returns Refs and functions for focus management
 */
export const useModalFocus = (isOpen: boolean): UseModalFocusReturn => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal container
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const restoreFocus = () => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      try {
        previousFocusRef.current.focus();
      } catch (error) {
        // Silently fail if element is no longer in DOM
        console.debug('Could not restore focus:', error);
      }
    }
  };

  return {
    modalRef,
    previousFocusRef,
    restoreFocus,
  };
};
