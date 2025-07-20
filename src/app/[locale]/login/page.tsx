'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import { useSettings } from '@/context/SettingsContext';
import Image from 'next/image';
import Link from 'next/link';
import Tooltip from '@/components/Tooltip';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';


export default function LoginPage() {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const logoCompany = settings.image;
  const backgroundColor = settings.footer_color;

  const t = useAuthTranslations();

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background */}
      <div className={`hidden md:flex w-1/2 bg-${backgroundColor} items-center justify-center`}>
        <div className="text-white text-center">
          <Link href='/'>
          <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
            {t.welcomeTitle} 
          </h1>
          </Link>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            {t.loginSubtitle}
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
      
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">

          <h1 className={`my-8 text-center tracking-wide text-xl sm:text-2xl font-extrabold text-${backgroundColor}`}>
            {t.loginButton}
          </h1>

          <LoginForm
            onShowPrivacy={() => setIsPrivacyOpen(true)}
            onShowTerms={() => setIsTermsOpen(true)}
          />

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

                        <Link href="/" >
            <span className="my-16 flex justify-center hover:bg-gray-50">
              {settings.image ? (
                 <Tooltip content="Home" >
                <Image
                  src={settings.image}
                  alt={t.logo}
                  width={60}
                  height={60}
                  className="h-8 w-auto"
                  onError={() => console.error('Failed to load logo:')}
                />
                 </Tooltip>
              ) : (
                <span className="text-gray-500"></span>
              )}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}