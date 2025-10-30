'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { useRegistration } from './hooks';
import PasswordStrengthIndicator from './auth/PasswordStrengthIndicator';
import { RegisterFormProps } from './types';

export default function RegisterForm({ isFreeTrial = false, onSuccess, redirectUrl }: RegisterFormProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState<boolean>(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const t = useAuthTranslations();
  const { register, isLoading, error, success } = useRegistration(isFreeTrial);

  // Auto-focus first input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Auto-generate username from email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Only auto-fill username if user hasn't manually edited it
    if (!usernameManuallyEdited) {
      if (newEmail.includes('@')) {
        // If email contains @, use part before @
        const generatedUsername = newEmail.split('@')[0];
        setUsername(generatedUsername);
      } else if (newEmail.length > 0) {
        // Otherwise, use the whole email as username
        setUsername(newEmail);
      } else {
        // Clear username if email is empty
        setUsername('');
      }
    }
  };

  // Track when user manually edits username
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    // Only mark as manually edited if user actually changes it (not just focuses)
    if (e.target.value !== email && e.target.value !== email.split('@')[0]) {
      setUsernameManuallyEdited(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await register({
      username,
      email,
      password,
    });

    // Call onSuccess callback if provided and registration was successful
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="auth-text-error text-center mb-4 p-3 bg-red-50 rounded-lg border border-red-200" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      {success && (
        <div className="auth-text-success text-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200" role="alert" aria-live="polite">
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-4">
          <div className="auth-field-1">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1.5">
              {t.email} <span className="text-red-500 text-base" aria-label="required">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-3 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-gray-900 min-h-[44px]"
                required
                placeholder={t.emailPlaceholder}
                aria-required="true"
                aria-invalid={error && !email ? 'true' : 'false'}
                autoComplete="email"
                enterKeyHint="next"
              />
              {email && (
                <svg className="absolute right-3 top-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          <div className="auth-field-2">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-1.5">
              {t.username} <span className="text-red-500 text-base" aria-label="required">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="w-full pl-10 pr-3 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-gray-900 min-h-[44px]"
                required
                placeholder={t.usernamePlaceholder}
                aria-required="true"
                aria-invalid={error && !username ? 'true' : 'false'}
                autoComplete="username"
                minLength={3}
                enterKeyHint="next"
              />
              {username && username.length >= 3 && (
                <svg className="absolute right-3 top-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">At least 3 characters</p>
          </div>
          <div className="relative auth-field-3">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-1.5">
              {t.password} <span className="text-red-500 text-base" aria-label="required">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-gray-900 min-h-[44px]"
                required
                placeholder={t.passwordPlaceholder}
                aria-describedby="password-strength password-requirements"
                aria-required="true"
                aria-invalid={error && !password ? 'true' : 'false'}
                autoComplete="new-password"
                minLength={8}
                enterKeyHint="done"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 pr-3 h-full flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors duration-200 min-h-[44px]"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                aria-pressed={showPassword}
                tabIndex={-1}
              >
                <span className="text-sm text-gray-500 hover:text-gray-700 font-medium">{showPassword ? t.hide : t.show}</span>
              </button>
            </div>
            <div id="password-requirements" className="sr-only">
              Password must be at least 8 characters long
            </div>
            <div id="password-strength" className="mt-2">
              <PasswordStrengthIndicator password={password} showIndicator={password.length > 0} />
            </div>
            <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-base auth-field-4">
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <svg className="auth-spinner h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isFreeTrial ? t.freeTrialLoading : t.registerLoading}
              </>
            ) : (
              <>
                {t.registerButton}
                <RightArrowDynamic />
              </>
            )}
          </Button>
        </div>

        {/* Trust signal */}
        <div className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1.5 auth-field-5">
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your information is encrypted and secure
        </div>
      </form>
    </div>
  );
}