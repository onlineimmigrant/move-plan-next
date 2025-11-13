/**
 * useMetricsDragDrop - Drag-drop reordering for metrics
 */

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export interface Metric {
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

export function useMetricsDragDrop(metrics: Metric[], onReorder: (reorderedMetrics: Metric[]) => Promise<void>) {
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = metrics.findIndex(m => m.id === active.id);
      const newIndex = metrics.findIndex(m => m.id === over.id);

      const reorderedMetrics = arrayMove(metrics, oldIndex, newIndex).map((metric, index) => ({
        ...metric,
        display_order: index,
      }));

      setIsReordering(true);
      try {
        await onReorder(reorderedMetrics);
      } catch (error) {
        console.error('Failed to reorder metrics:', error);
      } finally {
        setIsReordering(false);
      }
    }
  };

  return {
    sensors,
    isReordering,
    handleDragEnd,
    DndContext,
    SortableContext,
    verticalListSortingStrategy,
    closestCenter,
  };
}
