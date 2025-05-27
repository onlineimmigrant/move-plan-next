'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import { useSettings } from '@/context/SettingsContext';

export default function LoginPage() {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-sky-400 to-sky-700 items-center justify-center">
        <div className="text-white text-center">
          <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
            Welcome <br />to {settings?.site || ''}
          </h1>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            Start your learning journey with ease.
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <h1 className="my-8 text-center tracking-tight text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent">
            {settings?.site || 'Login'}
          </h1>

          <LoginForm
            onShowPrivacy={() => setIsPrivacyOpen(true)}
            onShowTerms={() => setIsTermsOpen(true)}
          />

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </div>
      </div>
    </div>
  );
}