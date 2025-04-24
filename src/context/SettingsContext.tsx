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
    console.log('SettingsProvider settings:', settings);

    // Validate that primary_color.hex is a valid HEX color
    const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
    let primaryColorHex = settings.primary_color.hex;
    let secondaryColorHex = settings.secondary_color.hex;

    if (!hexColorPattern.test(primaryColorHex)) {
      console.error(
        `Invalid HEX color in settings.primary_color.hex: "${primaryColorHex}". Falling back to #6B7280.`
      );
      primaryColorHex = '#6B7280'; // Default to gray-500
    }

    if (!hexColorPattern.test(secondaryColorHex)) {
      console.error(
        `Invalid HEX color in settings.secondary_color.hex: "${secondaryColorHex}". Falling back to #4B5563.`
      );
      secondaryColorHex = '#4B5563'; // Default to gray-600
    }

    // Set CSS variables for custom styling
    document.documentElement.style.setProperty('--primary-color', primaryColorHex);
    document.documentElement.style.setProperty('--secondary-color', secondaryColorHex);
    document.documentElement.style.setProperty('--font-family', settings.primary_font.name);
    document.documentElement.style.setProperty(
      '--font-size-base',
      `${settings.font_size_base.value}px`
    );
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