'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/Shared/ToastContainer';
import { revalidateHomepage } from '@/lib/revalidation';
import { TemplateHeadingSection } from '@/types/template_heading_section';

interface TemplateHeadingSectionEditContextType {
  isOpen: boolean;
  editingSection: TemplateHeadingSection | null;
  mode: 'create' | 'edit';
  refreshKey: number;
  openModal: (section?: TemplateHeadingSection, urlPage?: string) => void;
  closeModal: () => void;
  updateSection: (data: Partial<TemplateHeadingSection>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  refreshSections: () => void;
}

const TemplateHeadingSectionEditContext = createContext<TemplateHeadingSectionEditContextType | undefined>(undefined);

export const useTemplateHeadingSectionEdit = () => {
  const context = useContext(TemplateHeadingSectionEditContext);
  if (!context) {
    // Return safe defaults when provider not loaded yet (during deferred initialization)
    return {
      isOpen: false,
      editingSection: null,
      mode: 'create' as const,
      refreshKey: 0,
      openModal: () => {},
      closeModal: () => {},
      updateSection: async () => {},
      deleteSection: async () => {},
      refreshSections: () => {},
    };
  }
  return context;
};

interface TemplateHeadingSectionEditProviderProps {
  children: ReactNode;
}

export const TemplateHeadingSectionEditProvider: React.FC<TemplateHeadingSectionEditProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TemplateHeadingSection | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const openModal = useCallback((section?: TemplateHeadingSection, urlPage?: string) => {
    if (section) {
      setEditingSection(section);
      setMode('edit');
    } else {
      // Create new section with default values matching new structure
      setEditingSection({
        id: '0',
        url_page: urlPage || '',
        organization_id: null,
        content: {
          title: '',
          description: '',
          image: undefined,
          button: {
            text: undefined,
            url: undefined,
            is_text_link: true,
          },
        },
        translations: {},
        style: {
          background_color: 'white',
          title: {
            color: undefined,
            size: '3xl',
            font: 'sans',
            weight: 'bold',
          },
          description: {
            color: undefined,
            size: 'md',
            font: 'sans',
            weight: 'normal',
          },
          button: {
            color: undefined,
            text_color: 'white',
          },
          alignment: 'left',
          image_first: false,
          image_style: 'default',
          gradient: {
            enabled: false,
          },
        },
      });
      setMode('create');
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditingSection(null);
  }, []);

  const updateSection = useCallback(async (data: Partial<TemplateHeadingSection>) => {
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
      
      // Dispatch custom event to notify components of updates
      window.dispatchEvent(new CustomEvent('template-heading-section-updated', { 
        detail: savedSection 
      }));
      
      // Trigger cache revalidation for instant updates in production
      revalidateHomepage(savedSection.organization_id || undefined).catch(err => {
        console.warn('⚠️ Cache revalidation failed (non-critical):', err);
      });
      
      return savedSection;
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save heading section');
      throw error;
    }
  }, [mode, editingSection, toast]);

  const deleteSection = useCallback(async (id: string) => {
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
