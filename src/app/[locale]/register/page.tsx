'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import ContactModal from '@/components/contact/ContactModal';
import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/RegisterForm';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  const t = useAuthTranslations();

  const handleLogin = () => {
    router.push(`/${locale}/login`);
  };

  return (
    <AuthLayout
      title={t.welcomeTitle}
      subtitle={t.registerSubtitle}
    >
      <h1 className="mb-6 text-center tracking-wide text-xl sm:text-2xl font-bold text-gray-800">
        {t.registerTitle}
      </h1>

      <RegisterForm />

      <div className="mt-6 space-y-3 text-base">
        <button
          type="button"
          onClick={handleLogin}
          className="w-full auth-btn-outline py-2.5 px-4 rounded-lg font-medium"
        >
          {t.backToLogin}
        </button>
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

      <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </AuthLayout>
  );
}