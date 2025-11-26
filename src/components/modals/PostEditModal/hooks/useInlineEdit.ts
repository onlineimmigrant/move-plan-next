// hooks/useInlineEdit.ts - Inline editing functionality

import { useState, useCallback } from 'react';
import { InlineEditState, PostFormData } from '../types';

export function useInlineEdit(formData: PostFormData, updateField: (field: keyof PostFormData, value: any) => void) {
  const [inlineEdit, setInlineEdit] = useState<InlineEditState>({
    field: null,
    value: '',
    position: { x: 0, y: 0 },
  });

  const getSafePopoverPosition = useCallback((x: number, y: number) => {
    const popoverWidth = 500;
    const popoverHeight = 300;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const padding = 16;

    const safeX = Math.max(padding, Math.min(x, viewportWidth - popoverWidth - padding));
    const safeY = Math.max(padding, Math.min(y, viewportHeight - popoverHeight - padding));

    return { x: safeX, y: safeY };
  }, []);

  const handleInlineEditOpen = useCallback(
    (field: 'title' | 'description', event: React.MouseEvent) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setInlineEdit({
        field,
        value: formData[field],
        position: { x: rect.left, y: rect.bottom + 10 },
      });
    },
    [formData]
  );

  const handleInlineEditSave = useCallback(() => {
    if (inlineEdit.field && inlineEdit.value.trim()) {
      updateField(inlineEdit.field, inlineEdit.value);
    }
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  }, [inlineEdit, updateField]);

  const handleInlineEditCancel = useCallback(() => {
    setInlineEdit({ field: null, value: '', position: { x: 0, y: 0 } });
  }, []);

  return {
    inlineEdit,
    setInlineEdit,
    getSafePopoverPosition,
    handleInlineEditOpen,
    handleInlineEditSave,
    handleInlineEditCancel,
  };
}
