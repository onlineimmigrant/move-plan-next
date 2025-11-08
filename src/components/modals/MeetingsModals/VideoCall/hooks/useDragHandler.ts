import { useEffect, useRef, useCallback, RefObject } from 'react';

interface DragHandlerReturn {
  handleMouseDown: (e: React.MouseEvent) => void;
  isDraggingRef: RefObject<boolean>;
}

/**
 * Custom hook to handle dragging functionality for the video call modal
 */
export function useDragHandler(
  isFullscreen: boolean,
  isMinimized: boolean,
  isMobile: boolean,
  x: number,
  y: number,
  setX: (x: number) => void,
  setY: (y: number) => void
): DragHandlerReturn {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFullscreen || isMinimized || isMobile) return;
    
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: x,
      initialY: y
    };
    e.preventDefault();
  }, [isFullscreen, isMinimized, isMobile, x, y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      setX(dragStartRef.current.initialX + deltaX);
      setY(dragStartRef.current.initialY + deltaY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setX, setY]);

  return { handleMouseDown, isDraggingRef };
}
