'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, getOrganizationId } from '@/lib/supabase';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import { useSettings } from '@/context/SettingsContext';
import ContactModal from '@/components/contact/ContactModal';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import Tooltip from '@/components/Tooltip';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

// Define constants using Next.js environment variables
const DOMAIN_CUSTOM = process.env.NEXT_PUBLIC_DOMAIN_CUSTOM || 'http://localhost:3000';
const EMAIL_CONFIRM_REQUIRED = process.env.NEXT_PUBLIC_EMAIL_CONFIRM_REQUIRED === 'true';

export default function RegisterPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { settings } = useSettings();
  const { setSession } = useAuth();
  const router = useRouter();
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  const t = useAuthTranslations();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate inputs
    if (!username || !email || !password) {
      setError(t.fillAllFields);
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t.passwordTooShort);
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError(t.usernameTooShort);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch organization ID based on current domain
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        setError('Unable to identify organization. Please contact support.');
        setIsLoading(false);
        return;
      }

      const options = {
        data: { username },
        emailRedirectTo: `${DOMAIN_CUSTOM}/login`,
      };

      // Attempt sign-up with Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options,
      });

      if (authError) {
        console.error('Auth error:', authError.message, authError);
        if (authError.message.includes('already registered')) {
          setError(t.emailAlreadyExists);
        } else if (authError.message.includes('Database error saving new user')) {
          setError(t.serverError);
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      // Insert or update a profile row if user is created
      if (data.user) {
        const userId = data.user.id;
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              username,
              full_name: username,
              email: email.trim(),
              organization_id: organizationId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        if (profileError) {
          console.error('Profile creation error:', profileError.message, profileError.details);
          setError(`Failed to create or update user profile: ${profileError.message}`);
          setIsLoading(false);
          return;
        }

        // Trigger welcome email with organization_id
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'welcome',
              to: email.trim(),
              organization_id: organizationId,
              user_id: userId,
              name: username, // Pass username as name for welcome email
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to send welcome email:', errorData.error, errorData.details || '');
            setError((prev) => prev || 'Registration successful, but failed to send welcome email. Please contact support.');
          } else {
            console.log('Welcome email sent successfully');
          }
        } catch (emailError) {
          console.error('Error triggering welcome email:', emailError);
          setError((prev) => prev || 'Registration successful, but failed to send welcome email. Please contact support.');
          // Non-blocking: Email failure doesn't affect signup
        }
      }

      // Handle session or email confirmation
      if (data.session) {
        setSession(data.session);
        setSuccess(`${t.registrationSuccessful} ${t.redirectingToProfile}`);
        setTimeout(() => router.push('/account/profile'), 2000);
      } else if (EMAIL_CONFIRM_REQUIRED) {
        setSuccess(t.checkEmail);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setSuccess(`${t.registrationSuccessful} ${t.redirectingToLogin}`);
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || t.registrationFailed);
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side: Gradient background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-sky-400 to-sky-700 items-center justify-center">
       
        <div className="text-white text-center">
          <Link href="/">
            <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
              {t.welcomeTitle}
            </h1>
          </Link>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            {t.registerSubtitle}
          </p>
        </div>
      </div>

      {/* Right side: Register form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-sm p-6">

          <h1 className="my-8 text-center tracking-tight text-xl sm:text-2xl font-extrabold text-gray-900">
            {t.registerTitle}
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-teal-500 text-center mb-4">{success}</p>}

            <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  {t.username}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t.email}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t.password}
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-8 text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? t.hide : t.show}

                </button>
              </div>
            </div>

            <div className="mt-16 space-y-4 text-base">
              <Button
              variant='start'
                type="submit"
                disabled={isLoading}
                
              >
                {isLoading ? t.registerLoading : t.registerButton}
                 <RightArrowDynamic />
              </Button>
              <Button
              variant='start'
                type="button"
                onClick={handleLogin}
                className=" bg-yellow-200 text-gray-400 "
              >
                {t.backToLogin}
                <RightArrowDynamic />
              </Button>
            </div>

            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                {t.privacy}
              </button>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                {t.terms}
              </button>
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="text-sm text-gray-600 hover:text-sky-600 cursor-pointer"
              >
                {t.contact}
              </button>
            </div>
          </form>

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
       
      
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