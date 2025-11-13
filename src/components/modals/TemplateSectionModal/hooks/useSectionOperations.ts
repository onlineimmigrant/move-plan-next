/**
 * useSectionOperations - Save and delete operations for template sections
 */

import { useState } from 'react';
import { useTemplateSectionEdit } from '../context';

export interface TemplateSectionFormData {
  section_title: string;
  section_description: string;
  background_color: string;
  is_gradient: boolean;
  gradient: { from: string; via?: string; to: string } | null;
  text_style_variant: 'default' | 'apple' | 'codedharmony' | 'magazine' | 'startup' | 'elegant' | 'brutalist' | 'modern' | 'playful';
  grid_columns: number;
  image_metrics_height: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  is_image_bottom: boolean;
  is_slider: boolean;
  section_type: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans' | 'team' | 'testimonials' | 'appointment';
  // Deprecated - keep for backward compat
  is_reviews_section: boolean;
  is_help_center_section: boolean;
  is_real_estate_modal: boolean;
  is_brand: boolean;
  is_article_slider: boolean;
  is_contact_section: boolean;
  is_faq_section: boolean;
  is_pricingplans_section: boolean;
  url_page?: string;
  website_metric?: any[];
}

export function useSectionOperations() {
  const { updateSection, deleteSection, closeModal } = useTemplateSectionEdit();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (formData: TemplateSectionFormData) => {
    if (!formData.section_title || !formData.section_title.trim()) {
      alert('Please enter a section title');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateSection(formData);
      closeModal();
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sectionId?: number) => {
    if (!sectionId) return;
    
    try {
      await deleteSection(sectionId);
      setShowDeleteConfirm(false);
      closeModal();
    } catch (error) {
      console.error('Failed to delete:', error);
      throw error;
    }
  };

  return {
    isSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSave,
    handleDelete,
  };
}
