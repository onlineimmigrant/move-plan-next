'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';
import { TermsProps } from './types';

export default function Terms({ isOpen, onClose }: TermsProps) {
  const { settings } = useSettings();

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
              <Dialog.Panel className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-extrabold text-gray-800 auth-text-gradient-alt"
                  >
                    Terms of Service Summary
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="cursor-pointer text-gray-600 hover:text-[var(--color-primary-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] rounded-full p-1"
                    aria-label="Close terms of service modal"
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
                <div className="text-gray-700 text-sm leading-relaxed">
                                    <p className="mb-4">
                    At {settings?.site || 'our platform'}, we provide clear terms to ensure a fair and transparent experience. This summary highlights our key policies. For complete details, read our full{' '}
                    <Link href="/terms" className="auth-link font-medium cursor-pointer">
                      Terms of Service
                    </Link>.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">Privacy Policy:</strong> We protect your personal information, such as email and username, and outline how it's collected, used, and secured. See our{' '}
                    <Link href="/privacy-policy" className="auth-link font-medium cursor-pointer">
                      Privacy Policy
                    </Link>{' '}
                    for details.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">Cookie Policy:</strong> We use cookies to enhance your experience, track usage, and provide personalized content. Learn more in our{' '}
                    <Link href="/cookie-policy" className="auth-link font-medium cursor-pointer">
                      Cookie Policy
                    </Link>.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">Delivery Policy:</strong> Our digital services, such as courses or content, are delivered instantly upon purchase or subscription. Details are in our{' '}
                    <Link href="/delivery-policy" className="auth-link font-medium cursor-pointer">
                      Delivery Policy
                    </Link>.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">Return Policy:</strong> We offer refunds for eligible purchases within 14 days, subject to our conditions. See our{' '}
                    <Link href="/return-policy" className="auth-link font-medium cursor-pointer">
                      Return Policy
                    </Link>{' '}
                    for more.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">Licensing Terms:</strong> Content on our platform is licensed for personal, non-commercial use. Read our{' '}
                    <Link href="/licensing" className="auth-link font-medium cursor-pointer">
                      Licensing Terms
                    </Link>{' '}
                    for restrictions.
                  </p>
                  <p className="mb-4">
                    Questions? Contact us via our{' '}
                    <Link href="/contact" className="auth-link font-medium cursor-pointer">
                      contact form
                    </Link>{' '}
    
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}