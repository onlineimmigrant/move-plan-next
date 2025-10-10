// createModalContext.tsx - Factory for creating modal contexts with consistent patterns
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ModalContextValue<TData = any> {
  isOpen: boolean;
  data?: TData;
  openModal: (data?: TData) => void;
  closeModal: () => void;
}

export interface CreateModalContextOptions {
  contextName: string;
}

/**
 * Factory function to create a modal context with provider and hook
 * Reduces boilerplate for creating new modal contexts
 * 
 * @example
 * // Create a simple modal context
 * const { Provider: UserModalProvider, useModal: useUserModal } = createModalContext<{ userId: string }>({
 *   contextName: 'UserModal'
 * });
 * 
 * // Use in app
 * <UserModalProvider>
 *   <App />
 * </UserModalProvider>
 * 
 * // Use in component
 * const { isOpen, openModal, closeModal, data } = useUserModal();
 * openModal({ userId: '123' });
 */
export function createModalContext<TData = any>(
  options: CreateModalContextOptions
) {
  const { contextName } = options;
  
  const Context = createContext<ModalContextValue<TData> | undefined>(undefined);
  Context.displayName = `${contextName}Context`;

  function Provider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<TData | undefined>(undefined);

    const openModal = useCallback((modalData?: TData) => {
      setData(modalData);
      setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
      setIsOpen(false);
      // Clear data after animation
      setTimeout(() => setData(undefined), 300);
    }, []);

    const value: ModalContextValue<TData> = {
      isOpen,
      data,
      openModal,
      closeModal,
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useModal(): ModalContextValue<TData> {
    const context = useContext(Context);
    if (!context) {
      throw new Error(
        `use${contextName} must be used within ${contextName}Provider`
      );
    }
    return context;
  }

  return {
    Provider,
    useModal,
    Context,
  };
}
