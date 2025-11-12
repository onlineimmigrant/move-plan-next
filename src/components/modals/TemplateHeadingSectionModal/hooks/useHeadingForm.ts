/**
 * useHeadingForm Hook
 * 
 * Manages Heading Section form data state and initialization
 */

import { useState, useEffect } from 'react';
import { HeadingFormData } from '../types';

const DEFAULT_FORM_DATA: HeadingFormData = {
  name: '',
  name_part_2: '',
  name_part_3: '',
  description_text: '',
  button_text: '',
  url_page: '',
  url: '',
  image: '',
  image_first: false,
  is_included_templatesection: false,
  background_color: 'white',
  is_gradient: false,
  gradient: null,
  text_style_variant: 'default',
  is_text_link: false,
  title_alignment: 'left',
  title_style: {
    color: 'gray-800',
    weight: 'font-normal'
  },
  description_style: {
    color: 'gray-600',
    size: { desktop: 'text-xl', mobile: 'text-lg' },
    weight: 'font-light'
  },
  image_style: {
    position: 'default'
  },
  background_style: {},
  button_style: {}
};

export function useHeadingForm(editingSection: any) {
  const [formData, setFormData] = useState<HeadingFormData>(DEFAULT_FORM_DATA);

  // Initialize form data from editing section
  useEffect(() => {
    if (editingSection) {
      setFormData({
        name: editingSection.name || '',
        name_part_2: editingSection.name_part_2 || '',
        name_part_3: editingSection.name_part_3 || '',
        description_text: editingSection.description_text || '',
        button_text: editingSection.button_text || '',
        url_page: editingSection.url_page || '',
        url: editingSection.url || '',
        image: editingSection.image || '',
        image_first: editingSection.image_first || false,
        is_included_templatesection: editingSection.is_included_templatesection || false,
        background_color: editingSection.background_color || 'white',
        is_gradient: editingSection.is_gradient || false,
        gradient: editingSection.gradient || null,
        text_style_variant: editingSection.text_style_variant || 'default',
        is_text_link: editingSection.is_text_link || false,
        title_alignment: editingSection.title_alignment || 'left',
        title_style: editingSection.title_style || { color: 'gray-800', weight: 'font-normal' },
        description_style: editingSection.description_style || { 
          color: 'gray-600', 
          size: { desktop: 'text-xl', mobile: 'text-lg' },
          weight: 'font-light'
        },
        image_style: editingSection.image_style || { position: 'default' },
        background_style: editingSection.background_style || {},
        button_style: editingSection.button_style || {}
      });
    }
  }, [editingSection]);

  return {
    formData,
    setFormData,
  };
}
