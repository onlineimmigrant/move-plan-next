'use client';

import React from 'react';
import Button from '@/ui/Button';
import { useCookieTranslations } from './useCookieTranslations';

interface FooterButtonsProps {
  saveConsentSettings: () => void;
  handleConsent: (consentGiven: boolean) => void;
}

const FooterButtons: React.FC<FooterButtonsProps> = ({
  saveConsentSettings,
  handleConsent,
}) => {
  const t = useCookieTranslations();
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-center font-medium">
        {/* Apple-style primary action */}
        <button
          onClick={saveConsentSettings}
          aria-label={t.saveSettings}
          className="group relative overflow-hidden flex items-center justify-center px-7 py-3 text-[14px] font-semibold text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-600/25 focus:ring-offset-2 focus:ring-offset-transparent shadow-[0_4px_16px_rgba(75,85,99,0.24)] hover:shadow-[0_6px_20px_rgba(75,85,99,0.32)]"
        >
          <span className="relative z-20 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.95] antialiased">
            {t.saveSettings}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-full"></div>
        </button>

        {/* Apple-style secondary actions */}
        <button
          onClick={() => handleConsent(false)}
          aria-label={t.rejectAll}
          className="group flex items-center justify-center px-6 py-3 text-[14px] font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/90 active:bg-gray-150/90 backdrop-blur-sm rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-300/40 focus:ring-offset-2 focus:ring-offset-transparent shadow-sm hover:shadow-md"
        >
          <span className="relative z-10 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] antialiased">
            {t.rejectAll}
          </span>
        </button>

        <button
          onClick={() => handleConsent(true)}
          aria-label={t.acceptAll}
          className="group flex items-center justify-center px-6 py-3 text-[14px] font-medium text-gray-700 bg-transparent hover:bg-black/5 active:bg-black/10 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-black/8 focus:ring-offset-2 focus:ring-offset-transparent"
        >
          <span className="relative z-10 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] antialiased">
            {t.acceptAll}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FooterButtons;