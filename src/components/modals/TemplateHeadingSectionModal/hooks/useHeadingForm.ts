/**
 * useHeadingForm Hook
 * 
 * Manages Heading Section form data state and initialization
 */

import { useState, useEffect } from 'react';
import { HeadingFormData } from '../types';

const DEFAULT_FORM_DATA: HeadingFormData = {
  title: '',
  description: '',
  button_text: '',
  button_url: '',
  button_is_text_link: true,
  image: '',
  background_color: 'white',
  title_color: undefined,
  title_size: '3xl',
  title_font: 'sans',
  title_weight: 'bold',
  description_color: undefined,
  description_size: 'md',
  description_font: 'sans',
  description_weight: 'normal',
  button_color: undefined,
  button_text_color: 'white',
  alignment: 'left',
  image_first: false,
  image_style: 'default',
  gradient_enabled: false,
  gradient_config: undefined,
  url_page: '',
  title_translation: {},
  description_translation: {},
  button_text_translation: {},
};

export function useHeadingForm(editingSection: any) {
  const [formData, setFormData] = useState<HeadingFormData>(DEFAULT_FORM_DATA);

  // Initialize form data from editing section
  useEffect(() => {
    if (editingSection) {
      setFormData({
        title: editingSection.content?.title || '',
        description: editingSection.content?.description || '',
        button_text: editingSection.content?.button?.text || '',
        button_url: editingSection.content?.button?.url || '',
        button_is_text_link: editingSection.content?.button?.is_text_link ?? true,
        image: editingSection.content?.image || '',
        
        background_color: editingSection.style?.background_color || 'white',
        title_color: editingSection.style?.title?.color,
        title_size: editingSection.style?.title?.size || '3xl',
        title_font: editingSection.style?.title?.font || 'sans',
        title_weight: editingSection.style?.title?.weight || 'bold',
        description_color: editingSection.style?.description?.color,
        description_size: editingSection.style?.description?.size || 'md',
        description_font: editingSection.style?.description?.font || 'sans',
        description_weight: editingSection.style?.description?.weight || 'normal',
        button_color: editingSection.style?.button?.color,
        button_text_color: editingSection.style?.button?.text_color || 'white',
        alignment: editingSection.style?.alignment || 'left',
        image_first: editingSection.style?.image_first || false,
        image_style: editingSection.style?.image_style || 'default',
        gradient_enabled: editingSection.style?.gradient?.enabled || false,
        gradient_config: editingSection.style?.gradient?.config,
        
        url_page: editingSection.url_page || '',
        
        title_translation: editingSection.translations?.name || {},
        description_translation: editingSection.translations?.description || {},
        button_text_translation: editingSection.translations?.button_text || {},
      });
    }
  }, [editingSection]);

  return {
    formData,
    setFormData,
  };
}
