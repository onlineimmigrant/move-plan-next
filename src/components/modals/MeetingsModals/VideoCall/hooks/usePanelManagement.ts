'use client';

import { useState, useRef, useCallback } from 'react';

export interface PanelState {
  id: string;
  isMinimized: boolean;
  position: { x: number; y: number };
  isDragging: boolean;
  zIndex: number;
}

export interface UsePanelManagementReturn {
  panels: Record<string, PanelState>;
  registerPanel: (id: string, initialPosition?: { x: number; y: number }) => void;
  unregisterPanel: (id: string) => void;
  toggleMinimize: (id: string) => void;
  startDrag: (id: string, event: React.MouseEvent) => void;
  bringToFront: (id: string) => void;
  getMinimizedStack: () => string[];
}

export function usePanelManagement(): UsePanelManagementReturn {
  const [panels, setPanels] = useState<Record<string, PanelState>>({});
  const dragOffset = useRef({ x: 0, y: 0 });

  const registerPanel = useCallback((id: string, initialPosition = { x: 0, y: 0 }) => {
    setPanels(prev => {
      const newZIndex = Math.max(...Object.values(prev).map(p => p.zIndex), 99) + 1;
      return {
        ...prev,
        [id]: {
          id,
          isMinimized: false,
          position: initialPosition,
          isDragging: false,
          zIndex: newZIndex
        }
      };
    });
  }, []);

  const unregisterPanel = useCallback((id: string) => {
    setPanels(prev => {
      const newPanels = { ...prev };
      delete newPanels[id];
      return newPanels;
    });
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setPanels(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: !prev[id].isMinimized,
        isDragging: false
      }
    }));
  }, []);

  const startDrag = useCallback((id: string, event: React.MouseEvent) => {
    const panel = panels[id];
    if (!panel) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    setPanels(prev => {
      const newZIndex = Math.max(...Object.values(prev).map(p => p.zIndex), 99) + 1;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          isDragging: true,
          zIndex: newZIndex
        }
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      setPanels(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          position: {
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
          }
        }
      }));
    };

    const handleMouseUp = () => {
      setPanels(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isDragging: false
        }
      }));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panels]);

  const bringToFront = useCallback((id: string) => {
    setPanels(prev => {
      const newZIndex = Math.max(...Object.values(prev).map(p => p.zIndex), 99) + 1;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          zIndex: newZIndex
        }
      };
    });
  }, []);

  const getMinimizedStack = useCallback(() => {
    return Object.values(panels)
      .filter(panel => panel.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(panel => panel.id);
  }, [panels]);

  return {
    panels,
    registerPanel,
    unregisterPanel,
    toggleMinimize,
    startDrag,
    bringToFront,
    getMinimizedStack
  };
}