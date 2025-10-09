'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface PageCreationContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const PageCreationContext = createContext<PageCreationContextType | undefined>(undefined);

export const usePageCreation = () => {
  const context = useContext(PageCreationContext);
  if (!context) {
    throw new Error('usePageCreation must be used within PageCreationProvider');
  }
  return context;
};

interface PageCreationProviderProps {
  children: React.ReactNode;
}

export const PageCreationProvider: React.FC<PageCreationProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <PageCreationContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </PageCreationContext.Provider>
  );
};
