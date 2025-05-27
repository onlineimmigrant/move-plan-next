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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

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
          <div className="fixed inset-0 bg-gray-500 opacity-50" />
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
              <Dialog.Panel className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
                <div className="flex justify-end items-center mb-4">
                  <Dialog.Title
                    as="h2"
                    className="sr-only text-2xl font-extrabold text-gray-800 bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent"
                  >
                    {settings?.site || 'Login'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="cursor-pointer text-gray-600 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1"
                    aria-label="Close login modal"
                  >
                    <svg
                      className="h-6 w-6"
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
           <Image src='/images/logo.svg' alt="Logo" width={60} height={60} className="h-10 w-auto"/>
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