'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import { useStudentStatus } from '@/lib/StudentContext';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/ui/Loading';
import {
  UserIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  CreditCardIcon,
  CogIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

export default function AccountPage() {
  const { session, isAdmin, fullName, isLoading, error } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const pathname = usePathname();

  const combinedLoading = isLoading || studentLoading;

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  if (combinedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">Please log in to access your account.</p>
      </div>
    );
  }

  const dashboardLinks = [
    ...(isAdmin
      ? [
          {
            label: 'Admin',
            icon: <CogIcon className="h-10 w-10 text-sky-600 group-hover:text-sky-600 transition-colors" />,
            href: '/admin',
          },
        ]
      : []),
    ...(isStudent
      ? [
          {
            label: 'Student',
            icon: <AcademicCapIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
            href: '/account/edupro',
          },
        ]
      : []),
    {
      label: 'Profile',
      icon: <UserIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: '/account/profile',
    },
    {
      label: 'Purchases',
      icon: <ShoppingBagIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: '/account/purchases',
    },
    {
      label: 'Payments',
      icon: <CreditCardIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: '/account/payments',
    },
    {
      label: 'Billing',
      icon: <DocumentTextIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: '/account/payments/billing',
    },
    {
      label: 'Receipts',
      icon: <ReceiptPercentIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: '/account/payments/receipts',
    },
  ];

  return (
    <div className="min-h-screen pb-8 px-4 sm:px-6 lg:px-8">
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
          <h1 className="mt-16 sm:mt-18 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
            Account
            <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
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