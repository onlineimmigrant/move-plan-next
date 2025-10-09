// context/GlobalSettingsModalContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface GlobalSettingsModalState {
  isOpen: boolean;
  initialSection?: string; // Section to open/expand initially
}

interface GlobalSettingsModalActions {
  openModal: (initialSection?: string) => void;
  closeModal: () => void;
}

const GlobalSettingsModalContext = createContext<(GlobalSettingsModalState & GlobalSettingsModalActions) | null>(null);

export function GlobalSettingsModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<string | undefined>(undefined);

  const openModal = useCallback((section?: string) => {
    setInitialSection(section);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setInitialSection(undefined);
  }, []);

  const value = {
    isOpen,
    initialSection,
    openModal,
    closeModal,
  };

  return (
    <GlobalSettingsModalContext.Provider value={value}>
      {children}
    </GlobalSettingsModalContext.Provider>
  );
}

export function useGlobalSettingsModal() {
  const context = useContext(GlobalSettingsModalContext);
  if (!context) {
    throw new Error('useGlobalSettingsModal must be used within GlobalSettingsModalProvider');
  }
  return context;
}
