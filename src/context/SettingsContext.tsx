// src/context/SettingsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings } from '@/types/settings';

// Define the context type
interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Settings provider component
export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: Settings;
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  useEffect(() => {
    // Debug: Log the settings object to confirm the values
    console.log('🔧 SETTINGS PROVIDER INITIALIZED 🔧');
    console.log('SettingsProvider settings:', settings);
    console.log('Primary color from settings:', settings?.primary_color, settings?.primary_shade);
    console.log('Secondary color from settings:', settings?.secondary_color, settings?.secondary_shade);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}