// context/SiteMapModalContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SiteMapModalState {
  isOpen: boolean;
}

interface SiteMapModalActions {
  openModal: () => void;
  closeModal: () => void;
}

const SiteMapModalContext = createContext<(SiteMapModalState & SiteMapModalActions) | null>(null);

export function SiteMapModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = {
    isOpen,
    openModal,
    closeModal,
  };

  return (
    <SiteMapModalContext.Provider value={value}>
      {children}
    </SiteMapModalContext.Provider>
  );
}

export function useSiteMapModal() {
  const context = useContext(SiteMapModalContext);
  if (!context) {
    throw new Error('useSiteMapModal must be used within SiteMapModalProvider');
  }
  return context;
}
