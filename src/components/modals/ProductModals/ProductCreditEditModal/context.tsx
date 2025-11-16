/**
 * ProductCreditEditModal Context
 * 
 * Provides global state management for the Product modal,
 * allowing it to be opened from anywhere in the application.
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProductModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

interface ProductModalProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for ProductModal context
 * Wrap your app with this to enable modal state management
 * 
 * @example
 * ```tsx
 * <ProductModalProvider>
 *   <App />
 * </ProductModalProvider>
 * ```
 */
export function ProductModalProvider({ children }: ProductModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      openModal,
      closeModal,
    }),
    [isOpen, openModal, closeModal]
  );

  return (
    <ProductModalContext.Provider value={value}>
      {children}
    </ProductModalContext.Provider>
  );
}

/**
 * Hook to access ProductModal context
 * Use this in components to open/close the modal
 * 
 * @throws {Error} If used outside ProductModalProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openModal, closeModal, isOpen } = useProductModal();
 *   
 *   return (
 *     <button onClick={openModal}>
 *       Open Products
 *     </button>
 *   );
 * }
 * ```
 */
export function useProductModal() {
  const context = useContext(ProductModalContext);
  
  if (!context) {
    throw new Error('useProductModal must be used within ProductModalProvider');
  }
  
  return context;
}
