'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStatus } from '@/lib/StudentContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/ui/Button';
import Loading from '@/ui/Loading';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ProfileTable } from '@/components/account/ProfileTable';
import { ProfileEditModal } from '@/components/account/ProfileEditModal';
import { ProfileErrorBoundary } from '@/components/account/ProfileErrorBoundary';
import { useProfile, type Profile } from '@/hooks/useProfile';
import { useProfileModal } from '@/hooks/useProfileModal';

// Constants
import { FIELD_LABELS, EDITABLE_FIELDS } from '@/components/constants/profile';

// Validation Function with proper typing
const validateField = (
  field: string,
  value: string,
  t: ReturnType<typeof useAccountTranslations>['t']
): string | null => {
  if (!value.trim()) return `${FIELD_LABELS[field] || field} ${t.requiredField.toLowerCase()}`;
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return t.invalidEmail;
  }
  return null;
};

export default function ProfilePage() {
  return (
    <ProfileErrorBoundary>
      <ProfilePageContent />
    </ProfileErrorBoundary>
  );
}

function ProfilePageContent() {
  const { session, isLoading: authLoading } = useAuth();
  const accessToken = session?.access_token || null;
  const { isStudent, organizationId} = useStudentStatus();
  const { profile, setProfile, fetchProfile, isLoading: profileLoading, error: profileError } = useProfile(accessToken);
  const { t } = useAccountTranslations();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const {
    isModalOpen,
    editingField,
    fieldValue,
    setFieldValue,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    openModal,
    closeModal,
  } = useProfileModal();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const isLoading = authLoading || profileLoading;
  const error = profileError;

  // Define the desired field order with explicit typing
  const fieldOrder: (keyof Profile)[] = [
    'full_name',
    'email',
    'username',
    'city',
    'postal_code',
    'country',
    'role',
    'id',
    'uuid',
    'created_at',
    'updated_at',
  ];

  // Memoize sorted profile entries with proper typing
  const profileEntries = useMemo(() => {
    if (!profile) return [] as [keyof Profile, string | null][];
    return fieldOrder
      .filter((key): key is keyof Profile => key in profile)
      .map((key) => [key, profile[key]] as [keyof Profile, string | null]);
  }, [profile]);

  const handleEdit = (field: keyof Profile, currentValue: string | null) => {
    openModal(field, currentValue);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) {
      setToast({ message: 'No active session. Please log in.', type: 'error' });
      router.push('/login');
      return;
    }

    // Validate input
    if (editingField) {
      const validationError = validateField(editingField, fieldValue, t);
      if (validationError) {
        setFormError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ field: editingField, value: fieldValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile: Profile = await response.json();
      setProfile(updatedProfile);
      setToast({ message: t.profileUpdated, type: 'success' });
      closeModal();
    } catch (error) {
      setFormError((error as Error).message);
      setToast({ message: `${t.error}: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal();
    },
    [isModalOpen, closeModal]
  );

  return (
    <ProfileErrorBoundary>
      <div className="min-h-screen">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.profile}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t.personalInfo}
            </p>
          </div>
        </div>

        {/* Profile Content */}
        {isLoading ? (
          <TableSkeleton rows={10} columns={3} />
        ) : error ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 p-6 rounded-lg text-center mt-8">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            {accessToken && (
              <button
                onClick={fetchProfile}
                className="mt-4 text-white hover:opacity-90 focus:ring-2 px-4 py-2 rounded-md transition-all"
                style={{ backgroundColor: primary.base, boxShadow: `0 0 0 3px ${primary.lighter}40` }}
                aria-label="Retry fetching profile"
              >
                {t.loading}
              </button>
            )}
          </div>
        ) : profile ? (
          <ProfileTable 
            profile={profile}
            profileEntries={profileEntries}
            onEdit={handleEdit}
          />
        ) : (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 p-6 rounded-lg text-center" role="status" aria-live="polite">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No profile data found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              It looks like your profile data is not available.
            </p>
            <div className="mt-4">
              <button
                onClick={fetchProfile}
                className="text-white hover:opacity-90 focus:ring-2 rounded-full px-6 py-2 transition-all"
                style={{ backgroundColor: primary.base, boxShadow: `0 0 0 3px ${primary.lighter}40` }}
              >
                Refresh Profile
              </button>
            </div>
          </div>
        )}

        {/* Modal for Editing Profile Field */}
        <ProfileEditModal
          isOpen={isModalOpen}
          editingField={editingField}
          fieldValue={fieldValue}
          formError={formError}
          isSubmitting={isSubmitting}
          primary={primary}
          onFieldValueChange={setFieldValue}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onKeyDown={handleKeyDown}
        />
      </div>
    </ProfileErrorBoundary>
  );
}