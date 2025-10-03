'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import LoginForm from './LoginForm';
import Privacy from './Privacy';
import Terms from './Terms';
import { useSettings } from '@/context/SettingsContext';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const t = useAuthTranslations();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">

            {/* Modal Content */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-lg">
                {/* Glassmorphism gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none" />
                
                <div className="relative flex justify-end items-center mb-4">
                  <Dialog.Title
                    as="h2"
                    className="sr-only text-2xl font-extrabold bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent"
                  >
                    {settings?.site || t.loginButton}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="cursor-pointer bg-white/80 backdrop-blur-sm border border-white/30 text-gray-500 hover:text-gray-700 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 rounded-xl p-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    aria-label="Close login modal"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                                      <Link href='/'>
          <span className="mb-16 flex justify-center " >
                     {settings.image? (
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
                <LoginForm
                  onShowPrivacy={() => setIsPrivacyOpen(true)}
                  onShowTerms={() => setIsTermsOpen(true)}
                  onSuccess={onClose}
                />
                <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
                <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}