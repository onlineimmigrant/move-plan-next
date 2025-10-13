'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/Shared/ToastContainer';

// Types
interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  is_title_displayed: boolean;
  description: string;
  description_translation?: Record<string, string>;
  image?: string;
  is_image_rounded_full: boolean;
  is_card_type: boolean;
  background_color?: string;
  organization_id: string | null;
  template_section_id?: number;
  display_order?: number;
}

interface TemplateSectionData {
  id: number;
  background_color?: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  grid_columns: number;
  image_metrics_height?: string;
  is_image_bottom: boolean;
  is_slider?: boolean;
  section_type?: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';
  is_reviews_section: boolean;
  is_help_center_section?: boolean;
  is_real_estate_modal?: boolean;
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean;
  website_metric?: Metric[];
  organization_id: string | null;
  url_page?: string;
}

interface TemplateSectionEditContextType {
  isOpen: boolean;
  editingSection: TemplateSectionData | null;
  mode: 'create' | 'edit';
  refreshKey: number;
  openModal: (section: TemplateSectionData | null, urlPage?: string) => void;
  closeModal: () => void;
  updateSection: (data: Partial<TemplateSectionData>) => Promise<any>;
  deleteSection: (id: number) => Promise<void>;
  refreshSections: () => void;
  refetchEditingSection: () => Promise<void>;
}

const TemplateSectionEditContext = createContext<TemplateSectionEditContextType | undefined>(undefined);

export const useTemplateSectionEdit = () => {
  const context = useContext(TemplateSectionEditContext);
  if (!context) {
    throw new Error('useTemplateSectionEdit must be used within TemplateSectionEditProvider');
  }
  return context;
};

interface TemplateSectionEditProviderProps {
  children: ReactNode;
}

export const TemplateSectionEditProvider: React.FC<TemplateSectionEditProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TemplateSectionData | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const openModal = useCallback((section: TemplateSectionData | null = null, urlPage?: string) => {
    console.log('[TemplateSectionEditContext] openModal called:', { section, urlPage });
    
    if (section) {
      setEditingSection(section);
      setMode('edit');
    } else {
      // Create new section with default values
      const newSection = {
        id: 0,
        section_title: '',
        section_description: '',
        background_color: 'white',
        is_full_width: false,
        is_section_title_aligned_center: true,
        is_section_title_aligned_right: false,
        text_style_variant: 'default' as const,
        grid_columns: 3,
        is_image_bottom: false,
        is_slider: false,
        is_reviews_section: false,
        is_help_center_section: false,
        is_real_estate_modal: false,
        is_brand: false,
        is_article_slider: false,
        is_contact_section: false,
        is_faq_section: false,
        is_pricingplans_section: false,
        website_metric: [],
        organization_id: null,
        url_page: urlPage || '',
      };
      console.log('[TemplateSectionEditContext] Creating new section with data:', newSection);
      setEditingSection(newSection);
      setMode('create');
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditingSection(null);
  }, []);

  const updateSection = useCallback(async (data: Partial<TemplateSectionData>) => {
    try {
      console.log('[TemplateSectionEditContext] updateSection called:', { mode, data });
      
      const url = mode === 'create' 
        ? '/api/template-sections'
        : `/api/template-sections/${editingSection?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      // For updates, exclude fields that shouldn't be sent or can't be changed
      const payload = mode === 'create' ? data : {
        section_title: data.section_title,
        section_description: data.section_description,
        section_title_translation: data.section_title_translation,
        section_description_translation: data.section_description_translation,
        text_style_variant: data.text_style_variant,
        background_color: data.background_color,
        grid_columns: data.grid_columns,
        is_full_width: data.is_full_width,
        is_section_title_aligned_center: data.is_section_title_aligned_center,
        is_section_title_aligned_right: data.is_section_title_aligned_right,
        is_image_bottom: data.is_image_bottom,
        is_slider: data.is_slider,
        section_type: data.section_type || 'general',
        is_reviews_section: data.is_reviews_section,
        is_help_center_section: data.is_help_center_section,
        is_real_estate_modal: data.is_real_estate_modal,
        is_brand: data.is_brand,
        is_article_slider: data.is_article_slider,
        is_contact_section: data.is_contact_section,
        is_faq_section: data.is_faq_section,
        is_pricingplans_section: data.is_pricingplans_section,
        image_metrics_height: data.image_metrics_height,
      };

      console.log('Saving template section:', { url, method, payload, hasUrlPage: 'url_page' in payload, urlPageValue: (payload as any).url_page });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(error.error || error.message || 'Failed to save section');
      }

      const savedSection = await response.json();
      
      console.log('Successfully saved template section:', savedSection);
      
      // Update local state
      setEditingSection(savedSection);
      
      // Trigger refresh
      setRefreshKey(prev => prev + 1);
      
      // Show success message
      toast.success(mode === 'create' ? 'Section created successfully!' : 'Section updated successfully!');
      
      return savedSection;
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save section');
      throw error;
    }
  }, [mode, editingSection, toast]);

  const deleteSection = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/template-sections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete section');
      }

      // Trigger refresh
      setRefreshKey(prev => prev + 1);
      
      // Show success message
      toast.success('Section deleted successfully!');
      
      closeModal();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete section');
      throw error;
    }
  }, [closeModal, toast]);

  const refreshSections = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const refetchEditingSection = useCallback(async () => {
    if (!editingSection?.id || !editingSection?.url_page) {
      console.warn('Cannot refetch editing section: missing id or url_page');
      return;
    }

    try {
      console.log('Refetching editing section:', editingSection.id);
      
      // Fetch the updated section data
      const encodedUrlPage = encodeURIComponent(editingSection.url_page);
      const response = await fetch(`/api/template-sections?url_page=${encodedUrlPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to refetch section');
      }

      const sections = await response.json();
      const updatedSection = sections.find((s: TemplateSectionData) => s.id === editingSection.id);

      if (updatedSection) {
        console.log('Updated editing section with new data:', updatedSection);
        setEditingSection(updatedSection);
      } else {
        console.warn('Section not found in refetch response');
      }
    } catch (error) {
      console.error('Error refetching editing section:', error);
      toast.error('Failed to refresh section data');
    }
  }, [editingSection, toast]);

  const value = {
    isOpen,
    editingSection,
    mode,
    refreshKey,
    openModal,
    closeModal,
    updateSection,
    deleteSection,
    refreshSections,
    refetchEditingSection,
  };

  return (
    <TemplateSectionEditContext.Provider value={value}>
      {children}
    </TemplateSectionEditContext.Provider>
  );
};
