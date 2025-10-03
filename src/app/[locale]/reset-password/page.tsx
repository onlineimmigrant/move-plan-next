'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { setSession } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const t = useAuthTranslations();

  // Extract token from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const validateToken = async () => {
      if (!token) {
        setError('No token provided. Please request a new password reset link.');
        return;
      }

      try {
        console.log('Validating token:', token);
        const { data, error, status } = await supabase
          .from('password_resets')
          .select('*')
          .eq('token', token)
          .gte('expiry', new Date().toISOString())
          .single();

        console.log('Token validation result:', { data, error, status });
        if (error || !data) {
          setError('Invalid or expired reset link. Please request a new password reset link.');
        } else {
          console.log('Valid reset token found:', data);
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        setError('Invalid or expired reset link. Please request a new password reset link.');
      }
    };

    validateToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate inputs
    if (!newPassword || !confirmPassword) {
      setError(t.fillAllFields);
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError(t.passwordTooShort);
      setIsLoading(false);
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        throw new Error('No token provided.');
      }

      // Send password reset request to API route
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password.');
      }

      setSuccess(`${t.registrationSuccessful} ${t.redirectingToLogin}`);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.message || t.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side: Enhanced gradient background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-sky-600 via-sky-700 to-sky-800 items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent animate-pulse" />
        
        <div className="text-white text-center z-10 px-8">
          <h1 className="tracking-wide text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-sky-100 bg-clip-text text-transparent mb-6">
            {t.welcomeTo(settings?.site || '')}
          </h1>
          <p className="text-lg sm:text-xl text-sky-100 font-light leading-relaxed">
            {t.resetPasswordSubtitle}
          </p>
        </div>
      </div>

      {/* Right side: Reset password form with glassmorphism */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white relative">
        <Link href="/" className="absolute top-6 right-6 z-10">
          <div className="p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group">
            {settings.image ? (
              <Image
                src={settings.image}
                alt={t.logo}
                width={60}
                height={60}
                className="h-8 w-auto group-hover:scale-110 transition-transform duration-200"
                onError={() => console.error('Failed to load logo:')}
              />
            ) : (
              <span className="text-gray-400 text-sm">Home</span>
            )}
          </div>
        </Link>
        
        <div className="w-full max-w-sm p-6 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg mx-4">
          <h1 className="my-8 text-center tracking-tight text-xl sm:text-2xl font-extrabold">
            {t.resetPasswordTitle}
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-center mb-4">{success}</p>}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 placeholder:text-gray-500 text-gray-900 pr-10"
                  required
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
              <div className="relative">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.confirmPassword}
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 placeholder:text-gray-500 text-gray-900 pr-10"
                  required
                  placeholder={t.confirmPassword}
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

            <div className="mt-6 space-y-3">
              <Button variant="primary" type="submit" disabled={isLoading} className="w-full">
                {isLoading ? t.resetPasswordLoading : t.resetPasswordButton}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full"
              >
                {t.backToLogin}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}