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
  const backgroundColor = settings.footer_style;

  const t = useAuthTranslations();

  return (
    <div className="min-h-screen flex">
      {/* Left side: Enhanced gradient background */}
      <div className="hidden md:flex w-1/2 auth-gradient-bg items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent animate-pulse" />
        
        <div className="text-white text-center z-10 px-8">
          <Link href='/' className="block group">
          <h1 className="tracking-wide text-3xl sm:text-5xl font-bold auth-text-gradient mb-6 group-hover:scale-105 transition-transform duration-300">
            {t.welcomeTitle} 
          </h1>
          </Link>
          <p className="text-lg sm:text-xl text-sky-100 font-light leading-relaxed">
            {t.loginSubtitle}
          </p>
        </div>
      </div>

      {/* Right side: Login form with glassmorphism */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      
        <div className="w-full max-w-sm p-6 auth-form-container rounded-2xl shadow-lg mx-4">

          <h1 className="mb-6 text-center tracking-wide text-xl sm:text-2xl font-bold text-gray-800">
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