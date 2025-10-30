import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setSession } = useAuth();
  const router = useRouter();
  const t = useAuthTranslations();

  const login = async (formData: LoginFormData, redirectTo?: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError(t.fillAllFields);
      setIsLoading(false);
      return { success: false, error: t.fillAllFields };
    }

    try {
      // Attempt sign-in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        console.error('Login error:', authError.message);
        
        // Handle specific error cases
        if (authError.message.includes('Invalid login credentials')) {
          setError(t.invalidCredentials || 'Invalid email or password');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address');
        } else {
          setError(authError.message);
        }
        
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      // Set session in context
      if (data.session) {
        setSession(data.session);
        setSuccess(t.loginSuccessful || 'Login successful!');

        // Handle "remember me" functionality
        if (formData.rememberMe) {
          // Store preference (session is already persisted by Supabase)
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Redirect after a brief delay
        setTimeout(() => {
          const destination = redirectTo || '/account/profile';
          router.push(destination);
        }, 500);

        setIsLoading(false);
        return { success: true, data: data.session };
      }

      // If no session, something went wrong
      setError('Login failed. Please try again.');
      setIsLoading(false);
      return { success: false, error: 'No session created' };

    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.message || t.loginFailed || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return { success: false };
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return { success: false, error: resetError.message };
      }

      setSuccess('Password reset email sent. Please check your inbox.');
      setIsLoading(false);
      return { success: true };

    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.message || 'Failed to send password reset email');
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return {
    login,
    resetPassword,
    isLoading,
    error,
    success,
    clearMessages,
  };
}

export default useLogin;
