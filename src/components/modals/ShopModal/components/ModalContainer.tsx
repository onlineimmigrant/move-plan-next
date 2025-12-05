/**
 * ModalContainer Component
 * 
 * Glass morphism container with responsive behavior
 * - Mobile: Fullscreen modal (90vh)
 * - Desktop: Draggable/resizable modal with centered initial position
 * Matches TicketsAdminModal styling and positioning
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { Z_INDEX } from '../utils';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Modal container with glass morphism design
 * Responsive: fullscreen on mobile, draggable on desktop
 * 
 * @example
 * ```tsx
 * <ModalContainer isOpen={isOpen} onClose={handleClose}>
 *   <Header />
 *   <Body />
 *   <Footer />
 * </ModalContainer>
 * ```
 */
export function ModalContainer({ isOpen, onClose, children }: ModalContainerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile on client-side only
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal after a brief delay to ensure it's rendered
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: Z_INDEX.backdrop }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Responsive: Mobile fullscreen, Desktop draggable */}
      {isMobile ? (
        /* Mobile: Fixed fullscreen */
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Product Management Modal"
          tabIndex={-1}
          className="product-modal-root relative w-full h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      ) : (
        /* Desktop: Draggable & Resizable */
        <Rnd
          default={{
            x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - 560,
            y: (typeof window !== 'undefined' ? window.innerHeight : 900) / 2 - 450,
            width: 1120,
            height: 900,
          }}
          minWidth={800}
          minHeight={700}
          bounds="window"
          dragHandleClassName="modal-drag-handle"
          enableResizing={true}
          className="pointer-events-auto"
          style={{ zIndex: Z_INDEX.modal }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Product Management Modal"
            tabIndex={-1}
            className="product-modal-root relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </Rnd>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
