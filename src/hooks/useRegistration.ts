import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';
import { useAuthValidation, AuthFormData } from './useAuthValidation';

const DOMAIN_CUSTOM = process.env.NEXT_PUBLIC_DOMAIN_CUSTOM || 'http://localhost:3000';
const EMAIL_CONFIRM_REQUIRED = process.env.NEXT_PUBLIC_EMAIL_CONFIRM_REQUIRED === 'true';

export function useRegistration(isFreeTrial: boolean = false) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setSession } = useAuth();
  const router = useRouter();
  const t = useAuthTranslations();
  const { validateRegistration } = useAuthValidation();

  const register = async (formData: AuthFormData) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate form data
    const validation = validateRegistration(formData);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch organization ID
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        setError('Unable to identify organization. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Prepare signup options
      const options = {
        data: { username: formData.username },
        emailRedirectTo: `${DOMAIN_CUSTOM}/login`,
      };

      // Sign up with Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options,
      });

      if (authError) {
        handleAuthError(authError);
        return;
      }

      // Create user profile
      if (data.user) {
        await createUserProfile(data.user.id, formData, organizationId);

        // Handle free trial specific logic
        if (isFreeTrial) {
          await handleFreeTrialRegistration(formData.email);
        }

        // Send appropriate email
        await sendWelcomeEmail(formData, organizationId, data.user.id);

        // Handle post-registration flow
        handleRegistrationSuccess(data);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || t.registrationFailed);
      setIsLoading(false);
    }
  };

  const handleAuthError = (authError: any) => {
    console.error('Auth error:', authError.message, authError);
    if (authError.message.includes('already registered')) {
      setError(t.emailAlreadyExists);
    } else if (authError.message.includes('Database error saving new user')) {
      setError(t.serverError);
    } else {
      setError(authError.message);
    }
    setIsLoading(false);
  };

  const createUserProfile = async (userId: string, formData: AuthFormData, organizationId: string) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          username: formData.username,
          full_name: formData.username,
          email: formData.email.trim(),
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Profile creation error:', profileError.message, profileError.details);
      throw new Error(`Failed to create or update user profile: ${profileError.message}`);
    }
  };

  const handleFreeTrialRegistration = async (email: string) => {
    try {
      const registerResponse = await fetch('/api/register-user-free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        console.error('Failed to register user. Status:', registerResponse.status, 'Response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to complete registration. Please try again.');
        } catch {
          throw new Error('Unexpected response from registration API. Please try again.');
        }
      }
      console.log('Registration API call successful');
    } catch (apiError) {
      console.error('API call error:', apiError);
      throw new Error('Failed to complete free trial registration. Please try again.');
    }
  };

  const sendWelcomeEmail = async (formData: AuthFormData, organizationId: string, userId: string) => {
    try {
      const emailType = isFreeTrial ? 'free_trial' : 'welcome';
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          to: formData.email.trim(),
          organization_id: organizationId,
          user_id: userId,
          name: formData.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to send ${emailType} email:`, errorData.error, errorData.details || '');
        setError((prev) => prev || `Registration successful, but failed to send ${emailType} email. Please contact support.`);
      } else {
        console.log(`${emailType} email sent successfully`);
      }
    } catch (emailError) {
      console.error('Error triggering email:', emailError);
      setError((prev) => prev || 'Registration successful, but failed to send welcome email. Please contact support.');
    }
  };

  const handleRegistrationSuccess = (data: any) => {
    if (data.session) {
      setSession(data.session);
      setSuccess(`${t.registrationSuccessful} ${t.redirectingToProfile}`);
      setTimeout(() => router.push('/account/profile'), 2000);
    } else if (EMAIL_CONFIRM_REQUIRED) {
      setSuccess(t.checkEmail);
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setSuccess(`${t.registrationSuccessful} ${t.redirectingToLogin}`);
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return {
    register,
    isLoading,
    error,
    success,
    clearMessages: () => {
      setError('');
      setSuccess('');
    }
  };
}