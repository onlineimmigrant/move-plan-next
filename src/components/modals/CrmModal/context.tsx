'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CrmTab } from './types';

interface CrmModalContextType {
  isOpen: boolean;
  initialTab: CrmTab;
  openModal: (tab?: CrmTab) => void;
  closeModal: () => void;
}

const CrmModalContext = createContext<CrmModalContextType | undefined>(undefined);

export function CrmModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<CrmTab>('accounts');

  const openModal = useCallback((tab: CrmTab = 'accounts') => {
    setInitialTab(tab);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CrmModalContext.Provider value={{ isOpen, initialTab, openModal, closeModal }}>
      {children}
    </CrmModalContext.Provider>
  );
}

export function useCrmModal() {
  const context = useContext(CrmModalContext);
  if (!context) {
    throw new Error('useCrmModal must be used within CrmModalProvider');
  }
  return context;
}