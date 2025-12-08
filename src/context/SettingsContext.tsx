// src/context/SettingsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings } from '@/types/settings';

// Define the context type
interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
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

  // Function to update settings on the server
  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      console.log('📝 [SettingsContext] updateSettings called with:', updates);
      
      // Get organization ID from current settings state
      const organizationId = settings.organization_id;
      if (!organizationId) {
        throw new Error('Organization ID not found in settings');
      }

      console.log('🔑 [SettingsContext] Organization ID:', organizationId);

      // Optimistically update local state BEFORE the API call
      setSettings(prev => {
        const updated = { ...prev, ...updates };
        console.log('✨ [SettingsContext] Optimistic update - new state:', updated);
        return updated;
      });

      // Send update directly to settings table
      const response = await fetch(`/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          organization_id: organizationId,
          ...updates 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [SettingsContext] API error:', errorData);
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const responseData = await response.json();
      console.log('✅ [SettingsContext] API response:', responseData);
      
      // Update with complete server response
      if (responseData.settings) {
        setSettings(responseData.settings);
        console.log('🔄 [SettingsContext] Settings updated from server:', responseData.settings);
      }
    } catch (error) {
      console.error('❌ [SettingsContext] Error in updateSettings:', error);
      // Revert optimistic update on error
      setSettings(initialSettings);
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔔 [SettingsContext] Settings state changed:', {
      organization_id: settings.organization_id,
      legal_notice: settings.legal_notice,
      has_legal_notice: !!settings.legal_notice,
      legal_notice_enabled: settings.legal_notice?.enabled
    });
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, updateSettings }}>
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