'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';
import { PrivacyProps } from './types';

export default function Privacy({ isOpen, onClose }: PrivacyProps) {
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
          <div className="fixed inset-0 bg-gray-500 opacity-70" />
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
                    Privacy Policy Summary
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="cursor-pointer text-gray-600 hover:text-[var(--color-primary-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] rounded-full p-1"
                    aria-label="Close privacy policy modal"
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
                    At {settings?.site || 'our platform'}, we value your privacy and are committed to safeguarding your personal information. This summary outlines how we handle your data. For the complete details, read our full{' '}
                    <Link href="/privacy-policy" className="auth-link font-medium cursor-pointer">
                      Privacy Policy
                    </Link>.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">What We Collect:</strong> We collect information you provide, such as your email address, username, and profile details, to create and manage your account. We may also collect usage data to enhance your experience.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">How We Use It:</strong> Your data helps us deliver, personalize, and improve our services, communicate with you, and ensure platform security. We never sell your personal information.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">How We Protect It:</strong> We use industry-standard security measures to protect your data and limit access to authorized personnel only.
                  </p>
                  <p className="mb-4">
                    <strong className="font-semibold text-gray-800">Your Rights:</strong> You can access, update, or delete your account information at any time. Contact us to exercise your rights or learn more.
                  </p>
                  <p className="mb-4">
                    Have questions? Reach out via our{' '}
                    <Link href="/contact" className="text-sky-600 hover:text-sky-500 font-medium cursor-pointer">
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