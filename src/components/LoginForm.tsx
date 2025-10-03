'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/ui/Button';
import { v4 as uuidv4 } from 'uuid';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

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
  
  // Extract locale from pathname
  const locale = pathname.split('/')[1];

  const t = useAuthTranslations();

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
      setError(t.fillAllFields);
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
      setError(t.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    try {
      const registerPath = locale ? `/${locale}/register` : '/register';
      router.push(registerPath);
      console.log(`Navigation to ${registerPath}`);
    } catch (navError: unknown) {
      console.error('Register navigation error:', (navError as Error).message);
      const fallbackPath = locale ? `/${locale}/register` : '/register';
      window.location.href = fallbackPath;
    }
    if (onSuccess) onSuccess();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsLoading(true);

    if (!resetEmail) {
      setError(t.fillAllFields);
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

      setResetSuccess(t.resetPasswordSuccess);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: unknown) {
      console.error('Password reset failed:', (err as Error).message);
      setError(t.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-center">{error}</p>}
      {resetSuccess && <p className="text-green-500 text-center">{resetSuccess}</p>}

      {showForgotPassword ? (
        <div>
          <h2 className="mb-6 text-center tracking-wide text-xl sm:text-2xl font-bold text-gray-800">
            {t.passwordReset}
          </h2>
          <form onSubmit={handleForgotPassword} className="space-y-3">
          <div className="space-y-3">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                {t.email}
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 placeholder:text-gray-500 text-gray-900"
                required
                placeholder={t.email}
              />
            </div>
          </div>
                    <div className="mt-6 space-y-3">
            <Button variant="primary" type="submit" disabled={isLoading} className="w-full">
              {isLoading ? t.loading : t.forgotPassword}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} className="w-full">
              {t.loginButton}
            </Button>
          </div>
        </form>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.email}
              </label>
                                          <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 placeholder:text-gray-500 text-gray-900"
                placeholder={t.email}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.password}
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 placeholder:text-gray-500 text-gray-900 pr-10"
                placeholder={t.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-7.5 right-0 pr-3 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors duration-200 h-10"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                <span className="text-sm text-gray-500 hover:text-gray-700">
                  {showPassword ? t.hide : t.show}
                </span>
              </button>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-base">
            <Button variant="primary" type="submit" disabled={isLoading} className="w-full">
              {isLoading ? t.loginLoading : t.loginButton}
              <RightArrowDynamic />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRegister}
              className="w-full"
            >
              {t.registerButton}
              <RightArrowDynamic />
            </Button>
          </div>
          <div className="mt-6 flex justify-center space-x-6">
            <button
              type="button"
              onClick={onShowPrivacy}
              className="text-sm text-gray-500 hover:text-sky-600 focus:outline-none cursor-pointer transition-colors duration-200 underline hover:no-underline"
            >
              {t.privacy}
            </button>
            <button
              type="button"
              onClick={onShowTerms}
              className="text-sm text-gray-500 hover:text-sky-600 focus:outline-none cursor-pointer transition-colors duration-200 underline hover:no-underline"
            >
              {t.terms}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
            >
              {t.forgotPasswordQuestion}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}