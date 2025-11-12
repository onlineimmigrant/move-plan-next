/**
 * useHeadingSave Hook
 * 
 * Manages save functionality for heading section
 */

import { useState } from 'react';
import { HeadingFormData } from '../types';

export function useHeadingSave(
  updateSection: (data: HeadingFormData) => Promise<void>,
  closeModal: () => void
) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const handleSave = async (formData: HeadingFormData) => {
    setHasTriedSave(true);
    setSaveError(null);

    // Validation
    if (!formData.name.trim()) {
      setSaveError('Heading name is required');
      return false;
    }

    if (!formData.description_text.trim()) {
      setSaveError('Description text is required');
      return false;
    }

    if (!formData.url_page || !formData.url_page.trim()) {
      setSaveError('Page URL is required');
      return false;
    }

    setIsSaving(true);

    // Debug logging
    console.log('[HeadingModal] Saving formData:', JSON.stringify(formData, null, 2));

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
