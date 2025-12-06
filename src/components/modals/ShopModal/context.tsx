/**
 * ShopModal Context
 * 
 * Provides global state management for the Shop modal,
 * allowing it to be opened from anywhere in the application.
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ShopModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ShopModalContext = createContext<ShopModalContextType | undefined>(undefined);

interface ShopModalProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for ShopModal context
 * Wrap your app with this to enable modal state management
 * 
 * @example
 * ```tsx
 * <ShopModalProvider>
 *   <App />
 * </ShopModalProvider>
 * ```
 */
export function ShopModalProvider({ children }: ShopModalProviderProps) {
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
    <ShopModalContext.Provider value={value}>
      {children}
    </ShopModalContext.Provider>
  );
}

/**
 * Hook to access ShopModal context
 * Use this in components to open/close the modal
 * 
 * @throws {Error} If used outside ShopModalProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openModal, closeModal, isOpen } = useShopModal();
 *   
 *   return (
 *     <button onClick={openModal}>
 *       Open Products
 *     </button>
 *   );
 * }
 * ```
 */
export function useShopModal() {
  const context = useContext(ShopModalContext);
  
  if (!context) {
    // Return safe defaults when provider not loaded yet (during deferred initialization)
    return {
      isOpen: false,
      selectedProduct: null,
      quantity: 1,
      selectedVariant: null,
      openModal: () => {},
      closeModal: () => {},
      setQuantity: () => {},
      setSelectedVariant: () => {},
      addToBasket: async () => {},
    };
  }
  
  return context;
}
