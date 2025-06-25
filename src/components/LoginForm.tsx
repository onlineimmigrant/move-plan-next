'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/ui/Button';
import { v4 as uuidv4 } from 'uuid';
import RightArrowDynamic from '@/ui/RightArrowDynamic';

interface LoginFormProps {
  onShowPrivacy?: () => void;
  onShowTerms?: () => void;
  onSuccess?: () => void;
  redirectUrl?: string;
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
  const { setSession, isAdmin, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('searchParams:', searchParams.toString());
    console.log('redirectTo:', searchParams.get('redirectTo'));
  }, [searchParams]);

  const getRedirectUrl = () => {
    const redirectTo = searchParams.get('redirectTo');
    console.log('getRedirectUrl - redirectTo:', redirectTo, 'pathname:', pathname, 'isAdmin:', isAdmin);
    if (redirectTo && redirectTo !== '' && !['/login', '/register', '/reset-password'].includes(decodeURIComponent(redirectTo))) {
      console.log('Using redirectTo from query:', decodeURIComponent(redirectTo));
      return decodeURIComponent(redirectTo);
    }
    if (propRedirectUrl && !['/login', '/register', '/reset-password'].includes(propRedirectUrl)) {
      console.log('Using propRedirectUrl:', propRedirectUrl);
      return propRedirectUrl;
    }
    console.log('Falling back to:', isAdmin ? '/admin' : '/account', { isAdmin });
    return isAdmin ? '/admin' : '/account';
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
      const data = await login(email.trim(), password);
      console.log('Login data:', data);

      const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !sessionData.session) {
        console.error('Session refresh failed:', refreshError?.message);
        throw new Error('Failed to refresh session.');
      }
      setSession(sessionData.session);
      console.log('Session refreshed:', sessionData.session.user.id);
      console.log('Cookies after login:', document.cookie);

      const redirectTo = getRedirectUrl();
      console.log('Redirecting to:', redirectTo);
      try {
        router.push(redirectTo);
        console.log('Navigation completed to:', redirectTo);
      } catch (navError: unknown) {
        console.error('Navigation error:', (navError as Error).message);
        console.log('Falling back to window.location.href:', redirectTo);
        window.location.href = redirectTo;
      }
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Login failed:', (err as Error).message);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    try {
      router.push('/register');
      console.log('Navigation to /register');
    } catch (navError: unknown) {
      console.error('Register navigation error:', (navError as Error).message);
      window.location.href = '/register';
    }
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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const { getOrganizationId } = await import('@/lib/supabase');
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        throw new Error('Unable to identify organization.');
      }

      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('domain')
        .eq('organization_id', organizationId)
        .single();

      if (settingsError || !settings) {
        throw new Error(`Failed to fetch domain: ${settingsError?.message}`);
      }

      const domain = settings.domain;
      const resetToken = uuidv4();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      console.log('Inserting reset token for email:', resetEmail.trim());
      const { error: insertError } = await supabase
        .from('password_resets')
        .insert({
          email: resetEmail.trim(),
          token: resetToken,
          expiry: resetExpiry,
          organization_id: organizationId,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to store reset token: ${insertError.message}`);
      }

      const emailDomainRedirection = `https://${domain}/reset-password?token=${resetToken}`;
      console.log('Sending email payload:', { type: 'reset_email', to: resetEmail.trim(), organization_id: organizationId });
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reset_email',
          to: resetEmail.trim(),
          organization_id: organizationId,
          user_id: null,
          name: resetEmail.split('@')[0],
          emailDomainRedirection,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send reset email:', errorData.error);
        throw new Error('Failed to send reset email.');
      }

      setResetSuccess('Password reset email sent. Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: unknown) {
      console.error('Password reset failed:', (err as Error).message);
      setError('Failed to send password reset email. Try again or contact support.');
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>
          <div className="mt-16 space-y-4">
            <Button variant="start" type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>
            <Button
              type="button"
              variant="start"
              onClick={() => setShowForgotPassword(false)}
              className="bg-yellow-200 text-gray-400"
            >
              Back to Login
            </Button>
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="mt-16 space-y-4 text-base">
            <Button variant="start" type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
              <RightArrowDynamic />
            </Button>
            <Button
              type="button"
              variant="start"
              onClick={handleRegister}
              className="bg-yellow-200 text-gray-400"
            >
              Register
              <RightArrowDynamic />
            </Button>
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