import { useState, useRef, useCallback, useEffect } from 'react';

interface UseResizablePanelsProps {
  initialWidth?: number;
  isMobile: boolean;
  isCollapsed: boolean;
}

export function useResizablePanels({ 
  initialWidth = 75, 
  isMobile, 
  isCollapsed 
}: UseResizablePanelsProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Optimized mouse handlers using refs to avoid circular dependencies
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>();
  const handleMouseUpRef = useRef<() => void>();

  // Initialize handlers once on mount only
  useEffect(() => {
    handleMouseMoveRef.current = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      if (isCollapsed || isMobile) return;

      // Cancel any pending animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      // Use requestAnimationFrame to throttle updates
      animationFrameId.current = requestAnimationFrame(() => {
        if (!containerRef.current || !isDraggingRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartX.current;
        const deltaWidthPercent = (deltaX / containerRect.width) * 100;
        const newWidth = dragStartWidth.current + deltaWidthPercent;
        
        // Constrain between 20% and 75% to ensure both panels have minimum usable width
        const constrainedWidth = Math.min(75, Math.max(20, newWidth));
        setLeftPanelWidth(constrainedWidth);
      });
    };

    handleMouseUpRef.current = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      
      // Cancel any pending animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Clean up immediately
      if (handleMouseMoveRef.current) {
        document.removeEventListener('mousemove', handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        document.removeEventListener('mouseup', handleMouseUpRef.current);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).mozUserSelect = '';
      (document.body.style as any).msUserSelect = '';
    };
  }, [isCollapsed, isMobile]);

  // Create stable event handler references
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMouseMoveRef.current?.(e);
  }, []);

  const handleMouseUp = useCallback(() => {
    handleMouseUpRef.current?.();
  }, []);

  // Resize functionality - optimized
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || isMobile || isCollapsed) return;
    
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftPanelWidth;
    isDraggingRef.current = true;
    setIsDragging(true);
    
    // Add event listeners immediately
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
  }, [isMobile, isCollapsed, leftPanelWidth, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback(() => {
    if (isMobile) return; // No double-click reset on mobile
    setLeftPanelWidth(75); // Reset to 75/25 split
  }, [isMobile]);

  // Cleanup animation frame on unmount only
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Cleanup any lingering drag state
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).mozUserSelect = '';
      (document.body.style as any).msUserSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle mobile/desktop layout changes
  useEffect(() => {
    if (isMobile) {
      setLeftPanelWidth(100); // Full width when expanded on mobile
    } else if (!isCollapsed) {
      setLeftPanelWidth(75); // 75% settings, 25% preview on desktop
    }
  }, [isMobile, isCollapsed]);

  return {
    leftPanelWidth,
    isDragging,
    containerRef,
    handleMouseDown,
    handleDoubleClick,
    setLeftPanelWidth
  };
}
