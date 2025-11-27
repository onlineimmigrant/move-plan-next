/**
 * useHeadingSave Hook
 * 
 * Manages save functionality for heading section
 */

import { useState } from 'react';
import { HeadingFormData } from '../types';

export function useHeadingSave(
  updateSection: (data: any) => Promise<void>,
  closeModal: () => void
) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const handleSave = async (formData: HeadingFormData) => {
    setHasTriedSave(true);
    setSaveError(null);

    // Validation
    if (!formData.title.trim()) {
      setSaveError('Heading title is required');
      return false;
    }

    if (!formData.url_page || !formData.url_page.trim()) {
      setSaveError('Page URL is required');
      return false;
    }

    setIsSaving(true);

    // Transform formData to match new JSONB structure
    const saveData = {
      url_page: formData.url_page,
      content: {
        title: formData.title,
        description: formData.description || null,
        image: formData.image || null,
        button: {
          text: formData.button_text || null,
          url: formData.button_url || null,
          is_text_link: formData.button_is_text_link,
        },
      },
      translations: {
        name: formData.title_translation || {},
        description: formData.description_translation || {},
        button_text: formData.button_text_translation || {},
      },
      style: {
        background_color: formData.background_color,
        title: {
          color: formData.title_color || null,
          size: formData.title_size,
          font: formData.title_font,
          weight: formData.title_weight,
        },
        description: {
          color: formData.description_color || null,
          size: formData.description_size,
          font: formData.description_font,
          weight: formData.description_weight,
        },
        button: {
          color: formData.button_color || null,
          text_color: formData.button_text_color,
        },
        alignment: formData.alignment,
        image_first: formData.image_first,
        image_style: formData.image_style,
        gradient: {
          enabled: formData.gradient_enabled,
          config: formData.gradient_config || {},
        },
      },
    };

    // Debug logging
    console.log('[HeadingModal] Saving data:', JSON.stringify(saveData, null, 2));

    try {
      await updateSection(saveData);
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
