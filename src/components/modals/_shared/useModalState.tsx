// useModalState.tsx - Generic hook for modal state management
'use client';

import { useState, useCallback } from 'react';

export interface UseModalStateOptions<TData = any> {
  onOpen?: (data?: TData) => void;
  onClose?: () => void;
  defaultOpen?: boolean;
}

export interface UseModalStateReturn<TData = any> {
  isOpen: boolean;
  data: TData | undefined;
  openModal: (data?: TData) => void;
  closeModal: () => void;
  setData: (data: TData | undefined) => void;
}

/**
 * Generic hook for managing modal state
 * 
 * @example
 * // Simple modal
 * const modal = useModalState();
 * modal.openModal();
 * 
 * @example
 * // Modal with data
 * const modal = useModalState<{ id: number }>();
 * modal.openModal({ id: 123 });
 * console.log(modal.data?.id);
 * 
 * @example
 * // Modal with callbacks
 * const modal = useModalState({
 *   onOpen: () => console.log('opened'),
 *   onClose: () => console.log('closed')
 * });
 */
export function useModalState<TData = any>(
  options: UseModalStateOptions<TData> = {}
): UseModalStateReturn<TData> {
  const { onOpen, onClose, defaultOpen = false } = options;
  
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [data, setData] = useState<TData | undefined>(undefined);

  const openModal = useCallback((modalData?: TData) => {
    setData(modalData);
    setIsOpen(true);
    onOpen?.(modalData);
  }, [onOpen]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    // Clear data after animation completes (optional delay)
    setTimeout(() => setData(undefined), 300);
  }, [onClose]);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    setData,
  };
}
