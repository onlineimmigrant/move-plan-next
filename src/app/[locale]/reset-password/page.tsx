'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      {/* Left side: Gradient background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-sky-400 to-sky-700 items-center justify-center">
        <div className="text-white text-center">
          <h1 className="tracking-widest text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-300 to-white bg-clip-text text-transparent">
            {t.welcomeTo(settings?.site || '')}
          </h1>
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">
            {t.resetPasswordSubtitle}
          </p>
        </div>
      </div>

      {/* Right side: Reset password form */}
      <div className="w-full md:w-1/2 transparent flex items-center justify-center">
        <Link href="/">
          <span className="absolute top-4 right-4 mb-16 flex justify-center hover:bg-gray-50">
            {settings.image ? (
              <Image
                src={settings.image}
                alt={t.logo}
                width={60}
                height={60}
                className="h-8 w-auto"
                onError={() => console.error('Failed to load logo:')}
              />
            ) : (
              <span className="text-gray-500"></span>
            )}
          </span>
        </Link>
        <div className="w-full max-w-sm p-6 bg-transparent rounded-lg">
          <h1 className="my-8 text-center tracking-tight text-xl sm:text-2xl font-extrabold">
            {t.resetPasswordTitle}
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-center mb-4">{success}</p>}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  {t.password}
                </label>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-sm text-gray-600 hover:text-sky-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? t.hide : t.show}
                </button>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  {t.confirmPassword}
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="mt-16 space-y-4">
              <Button variant="start" type="submit" disabled={isLoading}>
                {isLoading ? t.resetPasswordLoading : t.resetPasswordButton}
              </Button>
              <Button
                variant="start"
                type="button"
                onClick={() => router.push('/login')}
                className="bg-yellow-200 text-gray-400"
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