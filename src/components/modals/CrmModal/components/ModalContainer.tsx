'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalContainerProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function ModalContainer({
  children,
  onClose,
  className = ''
}: ModalContainerProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle click outside
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden border border-white/20 ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}