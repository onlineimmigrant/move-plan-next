'use client';

import React from 'react';

interface FooterButtonsProps {
  saveConsentSettings: () => void;
  handleConsent: (consentGiven: boolean) => void;
  t?: (key: string) => string;
}

const FooterButtons: React.FC<FooterButtonsProps> = ({
  saveConsentSettings,
  handleConsent,
  t = (key: string) => key,
}) => {
  return (
    <div className="my-6">
      <div className="flex flex-wrap justify-center items-center gap-4 space-y-2 sm:space-y-0 font-medium">
        <button
          onClick={saveConsentSettings}
          className="w-full bg-gray-300 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 text-base font-bold transition-colors duration-300"
          aria-label={t('Save Settings')}
        >
          {t('Save Settings')}
        </button>
        <button
          onClick={() => handleConsent(false)}
          className="w-full bg-sky-500 text-white py-3 px-6 rounded-md hover:bg-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 text-base font-bold transition-colors duration-300"
          aria-label={t('Reject All')}
        >
          {t('Reject All')}
        </button>
        <button
          onClick={() => handleConsent(true)}
          className="w-full bg-sky-500 text-white py-3 px-6 rounded-md hover:bg-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 text-base font-bold transition-colors duration-300"
          aria-label={t('Accept All')}
        >
          {t('Accept All')}
        </button>
      </div>
    </div>
  );
};

export default FooterButtons;