/**
 * useSectionReorder Hook
 * Handles drag-and-drop reordering logic
 */

import { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
  page: string; // url_page field
  data: any;
}

export function useSectionReorder(initialSections: PageSection[]) {
  const [localSections, setLocalSections] = useState<PageSection[]>(initialSections);

  // Update local sections when initial sections change
  const updateSections = useCallback((sections: PageSection[]) => {
    setLocalSections(sections);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Reset to initial state
  const resetSections = useCallback((sections: PageSection[]) => {
    setLocalSections(sections);
  }, []);

  return {
    localSections,
    handleDragEnd,
    updateSections,
    resetSections,
  };
}
