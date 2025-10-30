'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginRegistration/LoginForm';
import Privacy from '@/components/LoginRegistration/Privacy';
import Terms from '@/components/LoginRegistration/Terms';
import AuthCard from '@/components/LoginRegistration/AuthCard';
import Link from 'next/link';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { useReturnUrl } from '@/components/LoginRegistration/hooks';


export default function LoginPage() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const t = useAuthTranslations();
  
  // Save return URL for redirect after login
  useReturnUrl();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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

      {/* Right side: Login form with glassmorphism - same style as modal */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full h-full md:h-auto md:max-w-md md:px-4">
          <AuthCard>
            <LoginForm
              onShowPrivacy={() => setIsPrivacyOpen(true)}
              onShowTerms={() => setIsTermsOpen(true)}
            />
          </AuthCard>

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </div>
      </div>
    </div>
  );
}