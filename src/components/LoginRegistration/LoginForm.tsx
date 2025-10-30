'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { useLogin } from './hooks';
import { LoginFormProps } from './types';

export default function LoginForm({ onShowPrivacy, onShowTerms, onSuccess, redirectUrl: propRedirectUrl, onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { isAdmin } = useAuth();
  const { login, resetPassword, isLoading, error, success, clearMessages } = useLogin();
  const [resetSuccess, setResetSuccess] = useState('');
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Refs for auto-focus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const resetEmailInputRef = useRef<HTMLInputElement>(null);
  
  // Extract locale from pathname - only valid locales (en, es, fr, de, etc)
  // If pathname is /login, locale will be empty. If /en/login, locale will be 'en'
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLocale = pathSegments[0];
  const validLocales = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl'];
  const locale = validLocales.includes(potentialLocale) ? potentialLocale : '';

  const t = useAuthTranslations();

  // Auto-focus first field on mount
  useEffect(() => {
    if (!showForgotPassword && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (showForgotPassword && resetEmailInputRef.current) {
      resetEmailInputRef.current.focus();
    }
  }, [showForgotPassword]);

  useEffect(() => {
    console.log('searchParams:', searchParams.toString());
    console.log('redirectTo:', searchParams.get('redirectTo'));
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Don't pass explicit redirectTo - let useLogin handle the smart redirect logic
    // It will check: URL params → localStorage returnUrl → current page → /account
    const result = await login({
      email,
      password,
      rememberMe,
    });

    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handleRegister = () => {
    console.log('handleRegister called', { onRegisterClick: !!onRegisterClick });
    
    // If onRegisterClick callback is provided (from modal), use it
    if (onRegisterClick) {
      console.log('Using onRegisterClick callback (modal mode)');
      onRegisterClick();
      return; // Return immediately, don't call onSuccess or navigate
    }

    // Otherwise, navigate to register page
    console.log('Navigating to register page (page mode)');
    try {
      const registerPath = locale ? `/${locale}/register` : '/register';
      router.push(registerPath);
      console.log(`Navigation to ${registerPath}`);
    } catch (navError: unknown) {
      console.error('Register navigation error:', (navError as Error).message);
      const fallbackPath = locale ? `/${locale}/register` : '/register';
      window.location.href = fallbackPath;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess('');

    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      setResetSuccess(t.resetPasswordSuccess || 'Password reset email sent. Please check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center text-sm" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      {resetSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center text-sm" role="alert" aria-live="polite">
          {resetSuccess}
        </div>
      )}

      {showForgotPassword ? (
        <div>
          <h2 className="mb-6 text-center tracking-wide text-xl sm:text-2xl font-bold text-gray-800">
            {t.passwordReset}
          </h2>
          <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-4">
            <div className="auth-field-1">
              <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-800 mb-2">
                {t.email}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  ref={resetEmailInputRef}
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-gray-900 min-h-[44px]"
                  required
                  placeholder={t.resetEmailPlaceholder}
                  aria-invalid={error ? 'true' : 'false'}
                  enterKeyHint="done"
                />
                {resetEmail && resetEmail.includes('@') && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Button variant="primary" type="submit" disabled={isLoading} className="w-full min-h-[44px] relative">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="spinner h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.loading}
                </span>
              ) : t.forgotPassword}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} className="w-full min-h-[44px]">
              {t.loginButton}
            </Button>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is encrypted and secure
          </div>
        </form>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-4">
            <div className="auth-field-1">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                {t.email}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full pl-10 pr-10 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-gray-900 min-h-[44px]"
                  placeholder={t.emailPlaceholder}
                  aria-invalid={error ? 'true' : 'false'}
                  enterKeyHint="next"
                />
                {email && email.includes('@') && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="relative auth-field-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                {t.password}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full pl-10 pr-20 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-gray-900 min-h-[44px]"
                  placeholder={t.passwordPlaceholder}
                  aria-invalid={error ? 'true' : 'false'}
                  enterKeyHint="done"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors duration-200"
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  <span className="text-sm text-gray-500 hover:text-gray-700">
                    {showPassword ? t.hide : t.show}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-base">
            <Button variant="primary" type="submit" disabled={isLoading} className="w-full min-h-[44px] relative">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="spinner h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.loginLoading}
                </span>
              ) : (
                <>
                  {t.loginButton}
                  <RightArrowDynamic />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRegister}
              className="w-full min-h-[44px]"
            >
              {t.registerButton}
              <RightArrowDynamic />
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-6 text-center">
            <button
              type="button"
              onClick={onShowPrivacy}
              className="auth-link text-sm focus:outline-none cursor-pointer underline hover:no-underline min-h-[44px] flex items-center"
            >
              {t.privacy}
            </button>
            <button
              type="button"
              onClick={onShowTerms}
              className="auth-link text-sm focus:outline-none cursor-pointer underline hover:no-underline min-h-[44px] flex items-center"
            >
              {t.terms}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="auth-link text-sm focus:outline-none cursor-pointer min-h-[44px] flex items-center"
            >
              {t.forgotPasswordQuestion}
            </button>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is encrypted and secure
          </div>
        </form>
      )}
    </div>
  );
}