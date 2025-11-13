/**
 * useLayoutData Hook
 * Manages page layout data fetching and state
 */

import { useState, useCallback, useEffect } from 'react';

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
  page: string; // url_page field (e.g., 'home', 'about', 'services')
  data: any;
}

interface LayoutStats {
  total: number;
  hero: number;
  template: number;
  heading: number;
}

export function useLayoutData(isOpen: boolean, organizationId: string | null) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LayoutStats>({
    total: 0,
    hero: 0,
    template: 0,
    heading: 0,
  });

  // Calculate stats whenever sections change
  useEffect(() => {
    const newStats = {
      total: sections.length,
      hero: sections.filter((s) => s.type === 'hero').length,
      template: sections.filter((s) => s.type === 'template_section').length,
      heading: sections.filter((s) => s.type === 'heading_section').length,
    };
    setStats(newStats);
  }, [sections]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const loadSections = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/page-layout?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page layout: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSections(data.sections || []);
    } catch (err) {
      console.error('[useLayoutData] Error fetching sections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load page sections');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const saveSectionOrder = useCallback(async (updatedSections: PageSection[]) => {
    if (!organizationId) return;

    try {
      // Prepare sections with updated order
      const sectionsToUpdate = updatedSections.map((section, index) => ({
        id: section.id,
        type: section.type,
        order: index * 10,
      }));

      const response = await fetch('/api/page-layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          sections: sectionsToUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update page layout');
      }

      // Update local state
      setSections(updatedSections.map((section, index) => ({
        ...section,
        order: index * 10,
      })));

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `org-${organizationId}` }),
      });
    } catch (err) {
      console.error('[useLayoutData] Error saving section order:', err);
      throw err;
    }
  }, [organizationId]);

  return {
    sections,
    isLoading,
    error,
    stats,
    loadSections,
    saveSectionOrder,
    setSections,
  };
}
