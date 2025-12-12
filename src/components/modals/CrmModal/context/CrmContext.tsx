/**
 * CrmContext - Shared state and utilities for CRM system
 * 
 * Provides:
 * - Organization ID
 * - Toast notifications
 * - Global refresh mechanism
 * - Theme colors
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Toast from '@/components/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface CrmContextValue {
  organizationId: string | undefined;
  setOrganizationId: (id: string) => void;
  primary: { base: string; hover: string };
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', action?: { label: string; onClick: () => void }) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [organizationId, setOrganizationId] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const themeColors = useThemeColors();

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info',
    action?: { label: string; onClick: () => void }
  ) => {
    setToast({ message, type, action });
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value: CrmContextValue = {
    organizationId,
    setOrganizationId,
    primary: { base: themeColors.cssVars.primary.base, hover: themeColors.cssVars.primary.hover },
    showToast,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <CrmContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          action={toast.action}
        />
      )}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within CrmProvider');
  }
  return context;
}
