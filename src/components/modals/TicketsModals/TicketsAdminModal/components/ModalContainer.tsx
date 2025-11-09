'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';

type WidgetSize = 'initial' | 'half' | 'fullscreen';

interface ModalContainerProps {
  isOpen: boolean;
  size: WidgetSize;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalContainer({
  isOpen,
  size,
  onClose,
  children,
}: ModalContainerProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

  // Get Rnd configuration based on modal size
  const getRndConfig = () => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

    switch (size) {
      case 'initial':
        return {
          x: windowWidth - 420,
          y: windowHeight - 780,
          width: 400,
          height: 750,
        };
      case 'half':
        return {
          x: windowWidth / 2,
          y: windowHeight * 0.1,
          width: Math.min(windowWidth * 0.5, 800),
          height: windowHeight * 0.85,
        };
      case 'fullscreen':
        return {
          x: 20,
          y: 20,
          width: windowWidth - 40,
          height: windowHeight - 40,
        };
      default:
        return {
          x: windowWidth - 420,
          y: windowHeight - 780,
          width: 400,
          height: 750,
        };
    }
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Draggable & Resizable Modal Container */}
      <Rnd
        default={getRndConfig()}
        minWidth={400}
        minHeight={600}
        bounds="window"
        dragHandleClassName="modal-drag-handle"
        enableResizing={size !== 'fullscreen'}
        className="pointer-events-auto z-[10001]"
      >
        <div 
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Ticket Management Modal"
          tabIndex={-1}
          className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {children}
        </div>
      </Rnd>
    </>
  );

  return createPortal(modalContent, document.body);
}
