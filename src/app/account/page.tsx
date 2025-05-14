// app/account/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStatus } from '@/lib/StudentContext';
import {
  UserIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface Profile {
  full_name: string | null;
}

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
        console.error('useAuth: Error:', error);
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

const useUserName = (accessToken: string | null) => {
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserName = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profiles', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user name');
      }
      const data: Profile = await response.json();
      setFullName(data.full_name);
    } catch (error) {
      console.error('useUserName: Error:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchUserName();
  }, [accessToken, fetchUserName]);

  return { fullName, isLoading, error, fetchUserName };
};

export default function AccountPage() {
  const { accessToken, isLoading: authLoading, error: authError } = useAuth();
  const { fullName, isLoading: nameLoading, error: nameError } = useUserName(accessToken);
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const pathname = usePathname();

  const isLoading = authLoading || nameLoading || studentLoading;
  const error = authError || nameError;

  const dashboardLinks = [
        ...(isStudent ? [{ label: 'Student', icon: <AcademicCapIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />, href: '/account/edupro' }] : []),
    { label: 'Profile', icon: <UserIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />, href: '/account/profile' },

    { label: 'Purchases', icon: <ShoppingBagIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />, href: '/account/purchases' },
    { label: 'Payments', icon: <CreditCardIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />, href: '/account/payments' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}
        <Link href="/account">
          <h1 className="mt-24 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
            Account
            <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full shadow-sm" />
          </h1>
        </Link>
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-sky-50 transition-all duration-300 ${
                  isActive ? 'bg-sky-50 shadow-md' : ''
                }`}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="transform group-hover:scale-110 transition-transform">{item.icon}</div>
                <span className="mt-3 text-sm font-medium text-gray-800 group-hover:text-sky-600 text-center sm:text-base">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {pathname === '/account' && (
          <div className="mt-24 sm:mt-32 text-gray-600 text-sm text-center">
            <h2 className="font-semibold text-gray-800">Hello, {fullName || 'User'}!</h2>
            Select a card to view your account details.
          </div>
        )}
      </div>
    </div>
  );
}