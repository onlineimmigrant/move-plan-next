'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import Privacy from '@/components/LoginRegistration/Privacy';
import Terms from '@/components/LoginRegistration/Terms';
import ContactModal from '@/components/contact/ContactModal';
import RegisterForm from '@/components/LoginRegistration/RegisterForm';
import AuthCard from '@/components/LoginRegistration/AuthCard';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import Link from 'next/link';

export default function RegisterFreeTrialPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  const t = useAuthTranslations();

  const handleLogin = () => {
    const loginPath = locale ? `/${locale}/login` : '/login';
    router.push(loginPath);
  };

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
            {t.registerFreeTrialSubtitle}
          </p>
        </div>
      </div>

      {/* Right side: Register form with glassmorphism - same style as modal */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full h-full md:h-auto md:max-w-md md:px-4">
          <AuthCard isWide={true}>
            <h1 className="mb-4 text-center tracking-wide text-xl font-bold text-gray-800">
              {t.registerFreeTrialTitle}
            </h1>

            <RegisterForm isFreeTrial={true} />

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogin}
                className="w-full"
              >
                {t.backToLogin}
                <RightArrowDynamic />
              </Button>
            </div>

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
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="text-sm auth-link cursor-pointer"
              >
                {t.contact}
              </button>
            </div>
          </AuthCard>

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </div>
      </div>
    </div>
  );
}