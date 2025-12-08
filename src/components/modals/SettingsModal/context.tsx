/**
 * SettingsModal Context
 * Provides state management for the Settings modal
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SettingsModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | undefined>(undefined);

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SettingsModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error('useSettingsModal must be used within SettingsModalProvider');
  }
  return context;
}
