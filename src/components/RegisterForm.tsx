'use client';

import { useState } from 'react';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { useRegistration } from '@/hooks/useRegistration';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

interface RegisterFormProps {
  isFreeTrial?: boolean;
  onSuccess?: () => void;
  redirectUrl?: string;
}

export default function RegisterForm({ isFreeTrial = false, onSuccess, redirectUrl }: RegisterFormProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const t = useAuthTranslations();
  const { register, isLoading, error, success } = useRegistration(isFreeTrial);

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
      {error && <p className="auth-text-error text-center mb-4">{error}</p>}
      {success && <p className="auth-text-success text-center mb-4">{success}</p>}

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="space-y-3">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              {t.username} <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-500 text-gray-900"
              required
              placeholder={t.username}
              aria-required="true"
              aria-invalid={error && !username ? 'true' : 'false'}
              autoComplete="username"
              minLength={3}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t.email} <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-500 text-gray-900"
              required
              placeholder={t.email}
              aria-required="true"
              aria-invalid={error && !email ? 'true' : 'false'}
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t.password} <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 auth-input rounded-xl focus:ring-2 transition-all duration-200 placeholder:text-gray-500 text-gray-900 pr-10"
              required
              placeholder={t.password}
              aria-describedby="password-strength password-requirements"
              aria-required="true"
              aria-invalid={error && !password ? 'true' : 'false'}
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-7.5 right-0 pr-3 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors duration-200 h-10"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
              tabIndex={-1}
            >
              <span className="text-sm text-gray-500 hover:text-gray-700">{showPassword ? t.hide : t.show}</span>
            </button>
            <div id="password-requirements" className="sr-only">
              Password must be at least 8 characters long
            </div>
            <div id="password-strength" className="mt-1">
              <PasswordStrengthIndicator password={password} showIndicator={password.length > 0} />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-base">
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (isFreeTrial ? t.freeTrialLoading : t.registerLoading) : t.registerButton}
            <RightArrowDynamic />
          </Button>
        </div>
      </form>
    </div>
  );
}