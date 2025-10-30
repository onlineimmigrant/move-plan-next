'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import RegisterForm from './RegisterForm';
import Privacy from './Privacy';
import Terms from './Terms';
import AuthCard from './AuthCard';
import { useSettings } from '@/context/SettingsContext';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { RegisterModalProps } from './types';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const t = useAuthTranslations();

  const handleSwitchToLogin = () => {
    console.log('handleSwitchToLogin called');
    if (onSwitchToLogin) {
      console.log('Calling onSwitchToLogin callback');
      onSwitchToLogin();
    } else {
      console.log('No onSwitchToLogin callback provided');
    }
  };

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
          <div className="fixed inset-0 auth-modal-backdrop" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen md:min-h-full items-stretch md:items-center justify-center p-0 md:p-4">

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
              <Dialog.Panel className="w-full md:w-auto">
                <AuthCard 
                  showCloseButton={true} 
                  onClose={onClose}
                  title={settings?.site || t.registerButton}
                  isWide={true}
                >
                  <h2 className="mb-4 text-center tracking-wide text-xl font-bold text-gray-800">
                    {t.registerTitle}
                  </h2>

                  <RegisterForm
                    onSuccess={onClose}
                  />

                  {/* Switch to Login */}
                  {onSwitchToLogin && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSwitchToLogin}
                        className="w-full"
                      >
                        {t.backToLogin}
                        <RightArrowDynamic />
                      </Button>
                    </div>
                  )}

                  {/* Privacy and Terms Links */}
                  <div className="mt-4 flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsPrivacyOpen(true)}
                      className="text-sm auth-link cursor-pointer"
                    >
                      {t.privacy}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="text-sm auth-link cursor-pointer"
                    >
                      {t.terms}
                    </button>
                  </div>

                  <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
                  <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
                </AuthCard>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
