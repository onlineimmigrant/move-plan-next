'use client';

import React from 'react';
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
        <div className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20">
          {children}
        </div>
      </Rnd>
    </>
  );

  return createPortal(modalContent, document.body);
}
