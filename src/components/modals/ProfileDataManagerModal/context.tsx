'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProfileDataManagerModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ProfileDataManagerModalContext = createContext<ProfileDataManagerModalContextType | undefined>(undefined);

export function ProfileDataManagerModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ProfileDataManagerModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ProfileDataManagerModalContext.Provider>
  );
}

export function useProfileDataManagerModal() {
  const context = useContext(ProfileDataManagerModalContext);
  if (!context) {
    throw new Error('useProfileDataManagerModal must be used within ProfileDataManagerModalProvider');
  }
  return context;
}