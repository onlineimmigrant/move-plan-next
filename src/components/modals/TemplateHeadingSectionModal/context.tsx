'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/Shared/ToastContainer';

// Types
interface TemplateHeadingSectionData {
  id: number;
  name: string;
  name_translation?: Record<string, string>;
  name_part_2?: string;
  name_part_3?: string;
  description_text?: string;
  description_text_translation?: Record<string, string>;
  button_text?: string;
  button_text_translation?: Record<string, string>;
  url_page?: string;
  url?: string;
  image?: string;
  image_first?: boolean;
  is_included_templatesection?: boolean;
  style_variant?: 'default' | 'clean';
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  is_text_link?: boolean;
  background_color?: string;
  organization_id?: string | null;
}

interface TemplateHeadingSectionEditContextType {
  isOpen: boolean;
  editingSection: TemplateHeadingSectionData | null;
  mode: 'create' | 'edit';
  refreshKey: number;
  openModal: (section?: TemplateHeadingSectionData, urlPage?: string) => void;
  closeModal: () => void;
  updateSection: (data: Partial<TemplateHeadingSectionData>) => Promise<void>;
  deleteSection: (id: number) => Promise<void>;
  refreshSections: () => void;
}

const TemplateHeadingSectionEditContext = createContext<TemplateHeadingSectionEditContextType | undefined>(undefined);

export const useTemplateHeadingSectionEdit = () => {
  const context = useContext(TemplateHeadingSectionEditContext);
  if (!context) {
    throw new Error('useTemplateHeadingSectionEdit must be used within TemplateHeadingSectionEditProvider');
  }
  return context;
};

interface TemplateHeadingSectionEditProviderProps {
  children: ReactNode;
}

export const TemplateHeadingSectionEditProvider: React.FC<TemplateHeadingSectionEditProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TemplateHeadingSectionData | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const openModal = useCallback((section?: TemplateHeadingSectionData, urlPage?: string) => {
    if (section) {
      setEditingSection(section);
      setMode('edit');
    } else {
      // Create new section with default values
      setEditingSection({
        id: 0,
        name: '',
        description_text: '',
        button_text: '',
        url: '',
        url_page: urlPage || '',
        image_first: false,
        is_included_templatesection: false,
        style_variant: 'default',
        text_style_variant: 'default',
        is_text_link: false,
        organization_id: null,
      });
      setMode('create');
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditingSection(null);
  }, []);

  const updateSection = useCallback(async (data: Partial<TemplateHeadingSectionData>) => {
    try {
      const url = mode === 'create' 
        ? '/api/template-heading-sections'
        : `/api/template-heading-sections/${editingSection?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save section');
      }

      const savedSection = await response.json();
      
      // Update local state
      setEditingSection(savedSection);
      
      // Trigger refresh
      setRefreshKey(prev => prev + 1);
      
      // Show success message
      toast.success(mode === 'create' ? 'Heading section created successfully!' : 'Heading section updated successfully!');
      
      return savedSection;
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save heading section');
      throw error;
    }
  }, [mode, editingSection, toast]);

  const deleteSection = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/template-heading-sections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete section');
      }

      // Trigger refresh
      setRefreshKey(prev => prev + 1);
      
      // Show success message
      toast.success('Heading section deleted successfully!');
      
      closeModal();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete heading section');
      throw error;
    }
  }, [closeModal, toast]);

  const refreshSections = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

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
  };

  return (
    <TemplateHeadingSectionEditContext.Provider value={value}>
      {children}
    </TemplateHeadingSectionEditContext.Provider>
  );
};
