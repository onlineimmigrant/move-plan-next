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
  // Deprecated - keep for backward compat (only is_reviews_section remains as it may still be in DB)
  is_reviews_section: boolean;
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
      // First, update individual metrics if they exist and have IDs
      if (formData.website_metric && formData.website_metric.length > 0) {
        const metricUpdatePromises = formData.website_metric
          .filter(metric => metric.id) // Only update existing metrics with IDs
          .map(async (metric) => {
            try {
              const response = await fetch(`/api/metrics/${metric.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: metric.title,
                  description: metric.description,
                  image: metric.image || null,
                  is_image_rounded_full: metric.is_image_rounded_full ?? false,
                  is_title_displayed: metric.is_title_displayed ?? true,
                  background_color: metric.background_color || null,
                  is_card_type: metric.is_card_type ?? false,
                  title_translation: metric.title_translation,
                  description_translation: metric.description_translation,
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                console.error(`Failed to update metric ${metric.id}:`, error);
                throw new Error(error.error || `Failed to update metric ${metric.id}`);
              }

              return await response.json();
            } catch (error) {
              console.error(`Error updating metric ${metric.id}:`, error);
              throw error;
            }
          });

        // Wait for all metric updates to complete
        await Promise.all(metricUpdatePromises);
        console.log('Successfully updated all metrics');
      }

      // Then update the section itself
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
