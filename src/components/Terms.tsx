'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface TermsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Terms({ isOpen, onClose }: TermsProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 ">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h2" className="text-2xl font-bold text-gray-800">
                    Terms of Service
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-600 hover:text-gray-800 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-gray-700">
                  <p className="mb-4">
                    Welcome to Let Spring! These Terms of Service govern your use of our website and services.
                  </p>
                  <p className="mb-4">
                    By accessing or using Let Spring, you agree to be bound by these Terms. If you do not agree with any part of the terms, you may not use our services.
                  </p>
                  <p className="mb-4">
                    <strong>Use of Services:</strong> You must provide accurate information during registration and use our services in compliance with all applicable laws.
                  </p>
                  <p className="mb-4">
                    <strong>Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your account and password.
                  </p>
                  <p className="mb-4">
                    For more details, please contact us at terms@letspring.com.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}