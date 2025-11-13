/**
 * useDragDropHandlers - Manages drag-and-drop reordering for menu items
 */

import { useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MenuItem } from '../types';

interface UseDragDropHandlersProps {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
}

export function useDragDropHandlers({ menuItems, setMenuItems }: UseDragDropHandlersProps) {
  /**
   * Configure drag sensors:
   * - PointerSensor: Requires 8px movement before dragging starts (prevents accidental drags)
   * - KeyboardSensor: Enables keyboard-based drag-and-drop for accessibility
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handles the end of a drag operation
   * Reorders menu items based on drop position
   * Note: Order values are assigned later by the backend API
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = menuItems.findIndex((item) => item.id === active.id);
      const newIndex = menuItems.findIndex((item) => item.id === over.id);
      
      const reorderedItems = arrayMove(menuItems, oldIndex, newIndex);
      setMenuItems(reorderedItems);
    }
  };

  return {
    sensors,
    handleDragEnd
  };
}
