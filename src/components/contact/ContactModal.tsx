'use client';

import { useRef, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import ContactForm from './ContactForm';
import { useSettings } from '@/context/SettingsContext';
import { useContactTranslations } from './useContactTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { settings } = useSettings();
  const { t } = useContactTranslations();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10002]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl h-auto max-h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="w-6 h-6" style={{ color: primary.base }} />
            <h2
              id="contact-modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {t.modalTitle}
            </h2>
          </div>

          {/* Close Button */}
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg"
            aria-label="Close contact modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20">
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t.modalSubtitle}
            </p>
            <ContactForm onSuccess={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
