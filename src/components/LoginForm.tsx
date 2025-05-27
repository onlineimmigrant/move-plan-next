'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface LoginFormProps {
  onShowPrivacy?: () => void;
  onShowTerms?: () => void;
  onSuccess?: () => void;
  redirectUrl?: string; // Optional prop for custom redirect
}

export default function LoginForm({ onShowPrivacy, onShowTerms, onSuccess, redirectUrl: propRedirectUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const { setSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Determine redirect URL: prefer prop, else use pathname, exclude /login or /register
  const getRedirectUrl = () => {
    if (propRedirectUrl && !['/login', '/register', '/reset-password'].includes(propRedirectUrl)) {
      return propRedirectUrl;
    }
    if (pathname && !['/login', '/register', '/reset-password'].includes(pathname)) {
      return pathname;
    }
    return '/account'; // Fallback
  };

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
        const redirectTo = getRedirectUrl();
        router.push(redirectTo);
        if (onSuccess) onSuccess(); // Close modal if applicable
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
    if (onSuccess) onSuccess();
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
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmail('');
          setResetSuccess('');
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-center">{error}</p>}
      {resetSuccess && <p className="text-green-500 text-center">{resetSuccess}</p>}

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
              onClick={onShowPrivacy}
              className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={onShowTerms}
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
    </div>
  );
}