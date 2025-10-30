'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import LoginForm from './LoginForm';
import Privacy from './Privacy';
import Terms from './Terms';
import AuthCard from './AuthCard';
import { useSettings } from '@/context/SettingsContext';
import { useState } from 'react';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { LoginModalProps } from './types';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const t = useAuthTranslations();

  const handleSwitchToRegister = () => {
    console.log('handleSwitchToRegister called');
    if (onSwitchToRegister) {
      console.log('Calling onSwitchToRegister callback');
      onSwitchToRegister();
    } else {
      console.log('No onSwitchToRegister callback provided');
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
                  title={settings?.site || t.loginButton}
                >
                  <LoginForm
                    onShowPrivacy={() => setIsPrivacyOpen(true)}
                    onShowTerms={() => setIsTermsOpen(true)}
                    onSuccess={onClose}
                    onRegisterClick={onSwitchToRegister ? handleSwitchToRegister : undefined}
                  />
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