/**
 * DraggableWrapper Component
 * 
 * Wrapper for react-rnd draggable/resizable functionality
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import type { DraggableData, ResizableDelta } from 'react-rnd';
import { ModalDimensions, ModalPosition } from '../types';
import { getDraggableBounds } from '../utils/modalSizing';

interface DraggableWrapperProps {
  /** Child content to wrap */
  children: React.ReactNode;
  
  /** Whether dragging is enabled */
  enableDrag?: boolean;
  
  /** Whether resizing is enabled */
  enableResize?: boolean;
  
  /** Default position */
  defaultPosition: ModalPosition;
  
  /** Default size */
  defaultSize: ModalDimensions;
  
  /** Minimum size */
  minSize: ModalDimensions;
  
  /** Z-index for the modal */
  zIndex?: number;
  
  /** CSS class for drag handle */
  dragHandleClassName?: string;
}

/**
 * Wrapper component that provides drag and resize functionality
 * Uses react-rnd for draggable and resizable modal
 */
export const DraggableWrapper: React.FC<DraggableWrapperProps> = ({
  children,
  enableDrag = true,
  enableResize = true,
  defaultPosition,
  defaultSize,
  minSize,
  zIndex = 10001,
  dragHandleClassName = 'modal-drag-handle',
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);

  const handleDragStop = useCallback((_e: any, data: DraggableData) => {
    setPosition({ x: data.x, y: data.y });
  }, []);

  const handleResizeStop = useCallback(
    (
      _e: MouseEvent | TouchEvent,
      _direction: any,
      ref: HTMLElement,
      _delta: ResizableDelta,
      position: ModalPosition
    ) => {
      setSize({
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
      setPosition(position);
    },
    []
  );

  return (
    <Rnd
      position={position}
      size={size}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={minSize.width}
      minHeight={minSize.height}
      bounds={getDraggableBounds()}
      disableDragging={!enableDrag}
      enableResizing={
        enableResize
          ? {
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }
          : false
      }
      dragHandleClassName={dragHandleClassName}
      style={{ zIndex }}
    >
      {children}
    </Rnd>
  );
};
