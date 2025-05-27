'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Privacy from '@/components/Privacy';
import Terms from '@/components/Terms';
import { useSettings } from '@/context/SettingsContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Toggle subform
  const [resetEmail, setResetEmail] = useState(''); // Email for reset subform
  const [resetSuccess, setResetSuccess] = useState(''); // Success message for reset
  const { settings } = useSettings();
  const { setSession } = useAuth();
  const router = useRouter();

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: supaError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (supaError) {
        throw new Error(supaError.message);
      }

      if (data.session) {
        setSession(data.session);
        router.push('/dashboard');
      } else {
        setError('No session data returned. Login failed.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsLoading(true);

    if (!resetEmail) {
      setError('Please enter your email to reset your password.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setResetSuccess('Password reset email sent. Check your inbox.');
        setTimeout(() => setShowForgotPassword(false), 2000); // Hide subform after 2 seconds
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Right side: Login form or Forgot Password subform */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <h1 className="my-8 text-center tracking-tight text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-700 via-sky-500 to-sky-700 bg-clip-text text-transparent">
            {showForgotPassword ? 'Reset Your Password' : settings?.site || ''}
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {resetSuccess && <p className="text-green-500 text-center mb-4">{resetSuccess}</p>}

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-16 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="text-xl w-full px-4 py-4 bg-sky-600 text-white rounded-full hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold cursor-pointer disabled:bg-sky-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-xl w-full px-4 py-4 bg-amber-300 text-white rounded-full hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold cursor-pointer mt-2"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
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

              <div className="mt-16 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="text-xl w-full px-4 py-4 bg-sky-600 text-white rounded-full hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold cursor-pointer disabled:bg-sky-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="text-xl w-full px-4 py-4 bg-amber-300 text-white rounded-full hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold cursor-pointer mt-2"
                >
                  Register
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
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          <Privacy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          <Terms isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </div>
      </div>
    </div>
  );
}