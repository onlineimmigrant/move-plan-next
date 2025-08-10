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
        {/* Apple-style backdrop with glass blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0 backdrop-blur-0"
          enterTo="opacity-100 backdrop-blur-md"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 backdrop-blur-md"
          leaveTo="opacity-0 backdrop-blur-0"
        >
          <div className="fixed inset-0 bg-black/20 backdrop-blur-md" 
               style={{
                 backdropFilter: 'blur(16px) saturate(180%)',
                 WebkitBackdropFilter: 'blur(16px) saturate(180%)',
               }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <div className="flex min-h-full items-center justify-center">
            {/* Apple-style Modal Content */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500 transform"
              enterFrom="opacity-0 scale-90 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300 transform"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <Dialog.Panel className="relative bg-white/95 backdrop-blur-3xl border border-black/8 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_25px_80px_rgba(0,0,0,0.15)] antialiased"
                style={{
                  backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                }}
              >
                {/* Subtle top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                
                {/* Inner glow for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <Dialog.Title
                        as="h2"
                        className="text-[24px] font-semibold text-gray-900 mb-2 tracking-[-0.02em] antialiased"
                      >
                        Contact Us
                      </Dialog.Title>
                      <p className="text-[15px] text-gray-600 antialiased opacity-90">Get in touch with our team for support and assistance</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="group cursor-pointer flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100/60 backdrop-blur-sm rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased ml-4"
                      aria-label="Close contact modal"
                    >
                      <svg
                        className="h-5 w-5 transition-all duration-300 group-hover:scale-105"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <ContactForm onSuccess={onClose} />
                </div>
                
                {/* Bottom accent */}
                <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent"></div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}