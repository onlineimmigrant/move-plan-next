'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ContactForm from './ContactForm';
import { useSettings } from '@/context/SettingsContext';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
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
              <Dialog.Panel className="bg-white rounded-lg p-6 max-w-lg w-full h-full sm:max-h-[95vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-extrabold text-gray-800 bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent"
                  >
                    Contact Us
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="cursor-pointer text-gray-600 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1"
                    aria-label="Close contact modal"
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
                <ContactForm onSuccess={onClose} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}