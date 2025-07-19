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
    <div className="my-2">
      <div className="flex flex-wrap justify-center items-center gap-4  sm:space-y-0 font-medium">
        <Button
        variant='start'
          onClick={saveConsentSettings}
                  aria-label={t.saveSettings}
        >
          {t.saveSettings}
        </Button>
        <Button
        variant='start'
          onClick={() => handleConsent(false)}
                  aria-label={t.rejectAll}
        >
          {t.rejectAll}
        </Button>
        <Button
        variant='start'
          onClick={() => handleConsent(true)}
                   aria-label={t.acceptAll}
        >
          {t.acceptAll}
        </Button>
      </div>
    </div>
  );
};

export default FooterButtons;