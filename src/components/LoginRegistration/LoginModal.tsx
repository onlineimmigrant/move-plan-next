'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { XMarkIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import LoginForm from './LoginForm';
import { useSettings } from '@/context/SettingsContext';

// Dynamically import Privacy and Terms to prevent headlessui bundling issues
const Privacy = dynamic(() => import('./Privacy'), {
  ssr: false,
  loading: () => null
});
const Terms = dynamic(() => import('./Terms'), {
  ssr: false,
  loading: () => null
});
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { LoginModalProps } from './types';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const t = useAuthTranslations();
  const logoUrl = settings?.image || '/logo.png';

  // ESC key handler
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

  const handleSwitchToRegister = () => {
    console.log('handleSwitchToRegister called');
    if (onSwitchToRegister) {
      console.log('Calling onSwitchToRegister callback');
      onSwitchToRegister();
    } else {
      console.log('No onSwitchToRegister callback provided');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10002]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            {/* Icon + Logo */}
            <ArrowLeftOnRectangleIcon 
              className="w-6 h-6" 
              style={{ color: themeColors.cssVars.primary.base }} 
            />
            {logoUrl && (
              <div className="relative h-8 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={settings?.site || 'Logo'}
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              </div>
            )}
            {/* Hidden title for accessibility */}
            <h2 id="login-modal-title" className="sr-only">
              {settings?.site || t.loginButton}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/20 dark:bg-gray-800/20">
          <LoginForm
            onShowPrivacy={() => setIsPrivacyOpen(true)}
            onShowTerms={() => setIsTermsOpen(true)}
            onSuccess={onClose}
            onRegisterClick={onSwitchToRegister ? handleSwitchToRegister : undefined}
          />
        </div>
      </div>

      {/* Privacy and Terms Modals */}
      <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}