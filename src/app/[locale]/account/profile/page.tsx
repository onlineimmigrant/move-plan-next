'use client';

import { useState, useEffect, useCallback, useRef, useMemo, InputHTMLAttributes, RefAttributes } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import FocusTrap from 'focus-trap-react';
import { FaTimes } from 'react-icons/fa';
import AccountTab from '@/components/AccountTab';
import { FiRefreshCw } from 'react-icons/fi';
import { useStudentStatus } from '@/lib/StudentContext';
import Button from '@/ui/Button';
import Loading from '@/ui/Loading';

// Constants
import { FIELD_LABELS, EDITABLE_FIELDS } from '@/components/constants/profile';

// Types
interface Profile {
  id: string;
  uuid: string;
  username: string;
  full_name: string | null;
  created_at: string;
  email: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  role: string | null;
  updated_at: string;
}

// Reusable Components
const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>) => (
  <input
    className={`block w-full border border-gray-200 rounded-md py-3 px-4 text-gray-900 focus:ring-1 focus:ring-sky-600 focus:border-sky-600 transition duration-150 ease-in-out placeholder-gray-400 text-sm ${className}`}
    {...props}
  />
);



// Custom Hook for Authentication
const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error(`Failed to fetch session: ${error.message}`);

        if (session) {
          setAccessToken(session.access_token);
        } else {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            throw new Error('No active session found. Please log in.');
          }
          setAccessToken(refreshData.session.access_token);
        }
      } catch (error) {
        setError((error as Error).message);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  return { accessToken, isLoading, error };
};

// Custom Hook for Profile
const useProfile = (accessToken: string | null) => {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profiles', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      const data: Profile = await response.json();
      setProfile(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchProfile();
  }, [accessToken, fetchProfile]);

  return { profile, setProfile, fetchProfile, isLoading, error };
};

// Custom Hook for Modal State Management
const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = (field: string, value: string | null) => {
    setEditingField(field);
    setFieldValue(value || '');
    setIsModalOpen(true);
    setFormError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingField(null);
    setFieldValue('');
    setFormError(null);
    setIsSubmitting(false);
  };

  return {
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
  };
};

// Validation Function
const validateField = (field: string, value: string): string | null => {
  if (!value.trim()) return `${FIELD_LABELS[field] || field} cannot be empty.`;
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address.';
  }
  return null;
};

export default function ProfilePage() {
  const { isStudent, organizationId} = useStudentStatus();
  const { accessToken, isLoading: authLoading, error: authError } = useAuth();
  const { profile, setProfile, fetchProfile, isLoading: profileLoading, error: profileError } = useProfile(accessToken);
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
  } = useModal();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isLoading = authLoading || profileLoading;
  const error = authError || profileError;

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

  // Focus the input when the modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

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
      const validationError = validateField(editingField, fieldValue);
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
      setToast({ message: 'Profile updated successfully', type: 'success' });
      closeModal();
    } catch (error) {
      setFormError((error as Error).message);
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}

        {/* Tabs Section */}
        <div className="pt-8">
          <AccountTab />
        </div>

        {/* Profile Content */}
        {error ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-medium">{error}</p>
            {accessToken && (
              <Button
                onClick={fetchProfile}
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-600"
                aria-label="Retry fetching profile"
              >
                Retry
              </Button>
            )}
          </div>
        ) : profile ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50"
                  >
                    Field
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profileEntries.map(([key, value]) => (
                  <tr key={key} className="hover:bg-gray-50 transition duration-150">
                    <td className="border-r border-gray-200 sm:min-w-xs min-w-48 px-6 py-4 text-sm text-gray-900 sticky left-0 z-10 bg-white">
                      {FIELD_LABELS[key] ?? key}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {value || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {key !== 'role' && EDITABLE_FIELDS.includes(key) ? (
                        <Button
                          onClick={() => handleEdit(key, value)}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                          aria-label={`Edit ${FIELD_LABELS[key] ?? key}`}
                        >
                          Edit
                        </Button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No profile data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              It looks like your profile data is not available.
            </p>
            <div className="mt-4">
              <Button
                onClick={fetchProfile}
                className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-600 rounded-full px-6"
              >
                Refresh Profile
              </Button>
            </div>
          </div>
        )}

        {/* Modal for Editing Profile Field */}
        {isModalOpen && editingField && (
          <FocusTrap>
            <div
              className="fixed bg-transparent inset-0 z-50"
              onKeyDown={handleKeyDown}
              role="dialog"
              aria-labelledby="modal-title"
              aria-modal="true"
            >
              <div
                className=" fixed inset-0 bg-transparent bg-opacity-75"
                onClick={closeModal}
                aria-hidden="true"
              />
              <div
                ref={modalRef}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                      Edit {FIELD_LABELS[editingField] || editingField}
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Close modal"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>
                  {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="field_value"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {FIELD_LABELS[editingField] || editingField}
                      </label>
                      <Input
                        id="field_value"
                        type={editingField === 'email' ? 'email' : 'text'}
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        placeholder={`Enter ${FIELD_LABELS[editingField] || editingField}...`}
                        ref={inputRef}
                      />
                      <p id="field_value_help" className="text-xs text-gray-500 mt-1">
                        {editingField === 'email'
                          ? 'Enter a valid email address (e.g., user@example.com).'
                          : 'Provide the updated value for this field.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button
                        type="submit"
                                  disabled={isSubmitting}
                        aria-label="Save changes"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        onClick={closeModal}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                        disabled={isSubmitting}
                        aria-label="Cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </FocusTrap>
        )}
      </div>
    </div>
  );
}