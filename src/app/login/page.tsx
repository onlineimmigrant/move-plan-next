'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import { useSettings } from '@/context/SettingsContext';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const { settings } = useSettings();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const logoCompany = settings.image;
  const backgroundColor = settings.footer_color;

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background */}
      <div className={`hidden md:flex w-1/2 bg-${backgroundColor} items-center justify-center`}>
        <div className="text-white text-center">
          <Link href='/'>
          <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
            Welcome 
          </h1>
          </Link>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            Start your learning journey with ease.
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
      
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <Link href='/'>
          <span className="mb-16 flex justify-center " >
                     {logoCompany? (
                       <Image
                         src={logoCompany}
                         alt="Logo"
                         width={40}
                         height={40}
                         className="h-8 w-auto"
                         onError={() => console.error('Failed to load logo:')}
                       />
                     ) : (
                       <span className="text-gray-500"></span>
                     )}
          </span>
          </Link>
          <h1 className={`my-8 text-center tracking-tight text-xl sm:text-2xl font-extrabold text-${backgroundColor}`}>
            Login
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