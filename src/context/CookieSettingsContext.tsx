'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CookieSettingsContextType {
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
}

const CookieSettingsContext = createContext<CookieSettingsContextType | undefined>(undefined);

export const CookieSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <CookieSettingsContext.Provider value={{ showSettings, setShowSettings }}>
      {children}
    </CookieSettingsContext.Provider>
  );
};

export const useCookieSettings = () => {
  const context = useContext(CookieSettingsContext);
  if (!context) {
    throw new Error('useCookieSettings must be used within a CookieSettingsProvider');
  }
  return context;
};