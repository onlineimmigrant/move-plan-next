/**
 * useModalKeyboard Hook
 * 
 * Manages keyboard interactions for modals
 */

import { useEffect, useCallback } from 'react';
import { UseModalKeyboardReturn } from '../types';

/**
 * Hook for managing modal keyboard shortcuts
 * 
 * Handles:
 * - Escape key to close
 * - Tab key for focus trap
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param closeOnEscape - Whether to allow closing with Escape (default: true)
 * @returns Keyboard event handler
 */
export const useModalKeyboard = (
  isOpen: boolean,
  onClose: () => void,
  closeOnEscape: boolean = true
): UseModalKeyboardReturn => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle Escape key
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [isOpen, onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  return {
    handleKeyDown,
  };
};
