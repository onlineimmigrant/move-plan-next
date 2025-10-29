/**
 * Shared Unsaved Changes Hook
 * Warns users before leaving page with unsaved changes
 */

import { useEffect, useCallback } from 'react';

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?'
}: UseUnsavedChangesOptions) {
  
  // Warn before page unload
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  /**
   * Get confirmation before executing action
   */
  const confirmAction = useCallback((actionMessage?: string): boolean => {
    if (!hasUnsavedChanges) return true;
    return window.confirm(actionMessage || message);
  }, [hasUnsavedChanges, message]);

  return {
    confirmAction
  };
}
