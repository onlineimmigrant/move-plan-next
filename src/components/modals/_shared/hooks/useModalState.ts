/**
 * useModalState Hook
 * 
 * Manages modal open/close state
 */

import { useState, useCallback } from 'react';
import { UseModalStateReturn } from '../types';

/**
 * Hook for managing modal state
 * 
 * @param initialState - Initial open/closed state (default: false)
 * @returns Modal state and control functions
 */
export const useModalState = (initialState: boolean = false): UseModalStateReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
