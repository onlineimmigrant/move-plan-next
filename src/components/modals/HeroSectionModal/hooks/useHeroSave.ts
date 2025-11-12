/**
 * useHeroSave Hook
 * 
 * Manages save functionality for hero section
 */

import { useState } from 'react';
import { HeroFormData } from '../types';

export function useHeroSave(
  updateSection: (data: HeroFormData) => Promise<void>,
  closeModal: () => void
) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const handleSave = async (formData: HeroFormData) => {
    setHasTriedSave(true);
    setSaveError(null);

    // Validation
    if (!formData.title.trim()) {
      setSaveError('Title is required');
      return false;
    }

    setIsSaving(true);

    // Debug logging
    console.log('[HeroModal] Saving formData:', JSON.stringify(formData, null, 2));
    console.log('[HeroModal] Title color:', formData.title_style?.color);
    console.log('[HeroModal] Background color:', formData.background_style?.color);
    console.log('[HeroModal] Button color:', formData.button_style?.color);
    console.log('[HeroModal] Description color:', formData.description_style?.color);

    try {
      await updateSection(formData);
      closeModal();
      return true;
    } catch (error: any) {
      console.error('Failed to save:', error);
      setSaveError(error?.message || 'Failed to save changes. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveError,
    hasTriedSave,
    handleSave,
    setSaveError,
  };
}
