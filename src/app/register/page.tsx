'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import { useSettings } from '@/context/SettingsContext';
import ContactModal from '@/components/ContactModal';
import Image from 'next/image';
import Link from 'next/link';




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
  const [isContactOpen, setIsContactOpen] = useState(false);

  // State for Privacy/Terms modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate inputs
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      setIsLoading(false);
      return;
    }

    const options = {
      data: { username },
      emailRedirectTo: `${DOMAIN_CUSTOM}/login`, // Redirect to login after email confirmation
    };

    try {
      // Attempt sign-up with Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // Insert a profile row if user is created
      if (data.user) {
        const userId = data.user.id;
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: userId, username, full_name: username });
        if (profileError) {
          console.error('Profile creation error:', profileError);
          setError('Failed to create user profile.');
          setIsLoading(false);
          return;
        }
      }

      // If a session is returned (no email confirmation required), set it
      if (data.session) {
        setSession(data.session);
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else if (EMAIL_CONFIRM_REQUIRED) {
        // Show success message for email confirmation
        setSuccess('Please check your email to confirm your account.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
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

      {/* Right side: Register form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <Link href='/'>
          <span className="mb-16 flex justify-center hover:bg-gray-50" >
           <Image src='/images/logo.svg' alt="Logo" width={60} height={60} className="h-12 w-auto"/>
          </span>
          </Link>
          <h1 className="my-8 text-center tracking-tight text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent">
            Create {settings?.site || ''} Account
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-teal-500 text-center mb-4">{success}</p>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="mt-16 space-y-4 text-base">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-4 bg-sky-600 text-white rounded-full hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold cursor-pointer disabled:bg-sky-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                onClick={handleLogin}
                className=" w-full px-4 py-4 bg-yellow-200 text-gray-600 hover:text-white rounded-full hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold cursor-pointer"
              >
                Back to Login
              </button>
            </div>

            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                Terms
              </button>
                <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="text-sm text-gray-600 hover:text-sky-600 cursor-pointer"
              >
                Contact
              </button>
            </div>
          </form>

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </div>
      </div>
    </div>
  );
}