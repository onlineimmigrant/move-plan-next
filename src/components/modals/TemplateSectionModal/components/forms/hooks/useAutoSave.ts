/**
 * useAutoSave - Debounced autosave with dirty tracking
 */

import { useEffect, useRef } from 'react';

interface UseAutoSaveProps {
  formTitle: string;
  formDescription: string;
  questions: any[];
  published: boolean;
  formSettings: any;
  dirty: boolean;
  loading: boolean;
  saveFormSilent: () => Promise<void>;
  setSaveState: (state: 'idle' | 'autosaving' | 'saved' | 'error') => void;
  setDirty: (dirty: boolean) => void;
}

export function useAutoSave({
  formTitle,
  formDescription,
  questions,
  published,
  formSettings,
  dirty,
  loading,
  saveFormSilent,
  setSaveState,
  setDirty,
}: UseAutoSaveProps) {
  const didHydrateRef = useRef(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      return;
    }
    
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    setSaveState('autosaving');
    autosaveTimeoutRef.current = setTimeout(() => {
      if (!loading && dirty) {
        saveFormSilent().then(() => {
          setDirty(false);
        });
      }
    }, 500);
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [formTitle, formDescription, questions, published, formSettings, dirty, loading, saveFormSilent, setSaveState, setDirty]);
}
