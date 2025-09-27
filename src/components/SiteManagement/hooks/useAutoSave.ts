import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '../types';

interface UseAutoSaveProps {
  settings: Settings;
  originalSettings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({ 
  settings, 
  originalSettings, 
  onSave, 
  debounceMs = 60000, 
  enabled = true 
}: UseAutoSaveProps) {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingSaveRef = useRef<boolean>(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !enabled || isAutoSaving || pendingSaveRef.current) {
      return;
    }

    pendingSaveRef.current = true;
    setIsAutoSaving(true);
    setAutoSaveError(null);

    try {
      await onSave(settings);
      setLastAutoSave(new Date());
      console.log('🔄 Auto-save completed successfully');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      setAutoSaveError(error instanceof Error ? error.message : 'Auto-save failed');
    } finally {
      setIsAutoSaving(false);
      pendingSaveRef.current = false;
    }
  }, [settings, hasUnsavedChanges, enabled, isAutoSaving, onSave]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [settings, hasUnsavedChanges, enabled, debounceMs, performAutoSave]);

  // Manual save function (for immediate saves)
  const triggerManualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performAutoSave();
  }, [performAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAutoSaving,
    lastAutoSave,
    autoSaveError,
    hasUnsavedChanges,
    triggerManualSave
  };
}
