'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { AuthCardProps } from './types';

export default function AuthCard({ 
  children, 
  showLogo = true, 
  showCloseButton = false, 
  onClose,
  title,
  isWide = false 
}: AuthCardProps) {
  const { settings } = useSettings();
  const t = useAuthTranslations();

  return (
    <div className="relative auth-modal-content p-6 w-full min-h-screen md:min-h-0 md:w-[440px] shadow-lg md:rounded-2xl rounded-none overflow-y-auto">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none" />
      
      <div className="relative">
        {/* Close button (for modals) */}
        {showCloseButton && onClose && (
          <div className="flex justify-end items-center mb-4">
            {title && (
              <h2 className="sr-only text-2xl font-extrabold bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg p-1.5 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Logo */}
        {showLogo && (
          <Link href='/'>
            <span className="mb-6 flex justify-center">
              {settings.image ? (
                <Image
                  src={settings.image}
                  alt={t.logo}
                  width={40}
                  height={40}
                  className="h-8 w-auto"
                  onError={() => console.error('Failed to load logo:')}
                />
              ) : (
                <span className="text-gray-500"></span>
              )}
            </span>
          </Link>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
