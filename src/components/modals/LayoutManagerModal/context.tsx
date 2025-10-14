'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
  data: any;
}

interface LayoutManagerContextType {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  organizationId: string | null;
  sections: PageSection[];
  openModal: (organizationId: string) => void;
  closeModal: () => void;
  fetchPageLayout: (organizationId: string) => Promise<void>;
  updateSectionOrder: (organizationId: string, sections: PageSection[]) => Promise<void>;
  reorderSections: (sections: PageSection[]) => void;
}

const LayoutManagerContext = createContext<LayoutManagerContextType | undefined>(undefined);

export const useLayoutManager = () => {
  const context = useContext(LayoutManagerContext);
  if (!context) {
    throw new Error('useLayoutManager must be used within a LayoutManagerProvider');
  }
  return context;
};

export const LayoutManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);

  const openModal = useCallback((orgId: string) => {
    setOrganizationId(orgId);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const fetchPageLayout = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/page-layout?organization_id=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch page layout');
      
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('[LayoutManagerContext] Error fetching page layout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSectionOrder = useCallback(async (organizationId: string, updatedSections: PageSection[]) => {
    setIsSaving(true);
    try {
      // Prepare sections with updated order
      const sectionsToUpdate = updatedSections.map((section, index) => ({
        id: section.id,
        type: section.type,
        order: index * 10
      }));

      const response = await fetch('/api/page-layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          sections: sectionsToUpdate
        })
      });

      if (!response.ok) throw new Error('Failed to update page layout');

      // Update local state
      setSections(updatedSections.map((section, index) => ({
        ...section,
        order: index * 10
      })));

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `org-${organizationId}` })
      });
    } catch (error) {
      console.error('[LayoutManagerContext] Error updating page layout:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const reorderSections = useCallback((newSections: PageSection[]) => {
    setSections(newSections);
  }, []);

  const value: LayoutManagerContextType = {
    isOpen,
    isLoading,
    isSaving,
    organizationId,
    sections,
    openModal,
    closeModal,
    fetchPageLayout,
    updateSectionOrder,
    reorderSections
  };

  return (
    <LayoutManagerContext.Provider value={value}>
      {children}
    </LayoutManagerContext.Provider>
  );
};
