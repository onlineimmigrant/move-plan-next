// Modal.tsx - Base modal component with portal, draggable, and resizable support
'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  draggable?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  zIndex?: number;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'w-full h-full',
};

/**
 * ModalContent - The actual modal content wrapper
 * Supports both static and draggable/resizable modes
 */
export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className,
  size = 'lg',
  draggable = false,
  resizable = false,
  fullscreen = false,
  onClick,
}) => {
  const defaultSize = {
    sm: { width: 448, height: 500 },
    md: { width: 576, height: 600 },
    lg: { width: 672, height: 650 },
    xl: { width: 896, height: 700 },
    full: { width: '100%', height: '100%' },
  };

  if (fullscreen) {
    // Fullscreen mode - fixed positioning
    return (
      <div 
        className={cn(
          'fixed inset-0 flex items-center justify-center',
          className
        )}
        onClick={onClick}
      >
        <div className="relative bg-white shadow-xl w-full h-screen flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  if (draggable || resizable) {
    // Draggable/Resizable mode using react-rnd
    const initialSize = typeof defaultSize[size] === 'object' && 'width' in defaultSize[size]
      ? defaultSize[size] as { width: number; height: number }
      : { width: 896, height: 800 };

    // On mobile, make it responsive (not draggable/resizable)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      // Mobile: Use fullscreen mode
      return (
        <div 
          className={cn(
            'fixed inset-0 flex items-center justify-center',
            className
          )}
          onClick={onClick}
        >
          <div 
            className={cn(
              'relative bg-white w-full h-full flex flex-col',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      );
    }

    // Desktop: Use draggable/resizable
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <Rnd
          default={{
            x: window.innerWidth / 2 - initialSize.width / 2,
            y: Math.max(50, window.innerHeight / 2 - initialSize.height / 2),
            width: initialSize.width,
            height: initialSize.height,
          }}
          minWidth={400}
          minHeight={350}
          bounds="window"
          dragHandleClassName="modal-drag-handle"
          enableResizing={resizable}
          className="pointer-events-auto"
        >
          <div 
            className={cn(
              'relative bg-white rounded-lg shadow-2xl h-full flex flex-col overflow-hidden',
              className
            )}
            onClick={onClick}
          >
            {children}
          </div>
        </Rnd>
      </div>
    );
  }

  // Static centered mode
  return (
    <div 
      className={cn(
        'fixed inset-0 flex items-center justify-center',
        'sm:p-4',
        className
      )}
      onClick={onClick}
    >
      <div 
        className={cn(
          'relative bg-white flex flex-col',
          'w-full h-full sm:rounded-lg sm:shadow-xl sm:w-auto sm:h-auto',
          'sm:max-h-[85vh]',
          'sm:' + sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Modal - Root modal component with portal and accessibility
 * Handles backdrop, escape key, and focus management
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  zIndex = 60,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      ref={modalRef}
      className={cn('fixed inset-0', className)}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );

  // Render in portal to escape parent stacking contexts
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
};
