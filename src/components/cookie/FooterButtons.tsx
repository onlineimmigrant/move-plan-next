'use client';

import React from 'react';
import Button from '@/ui/Button';

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
        <Button
        variant='start'
          onClick={saveConsentSettings}
                  aria-label={t('Save Settings')}
        >
          {t('Save Settings')}
        </Button>
        <Button
        variant='start'
          onClick={() => handleConsent(false)}
                  aria-label={t('Reject All')}
        >
          {t('Reject All')}
        </Button>
        <Button
        variant='start'
          onClick={() => handleConsent(true)}
                   aria-label={t('Accept All')}
        >
          {t('Accept All')}
        </Button>
      </div>
    </div>
  );
};

export default FooterButtons;