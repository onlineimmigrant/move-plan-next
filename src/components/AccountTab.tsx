// components/AccountTab.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStudentStatus } from '@/lib/StudentContext';

interface Tab {
  label: string;
  href: string;
}

interface AccountTabProps {
  className?: string;
}

export default function AccountTab({ className = '' }: AccountTabProps) {
  const pathname = usePathname();
  const { isStudent, isLoading } = useStudentStatus();

  const tabs: Tab[] = [
    ...(isStudent ? [{ label: 'Student', href: '/account/edupro' }] : []),
    { label: 'Profile', href: '/account/profile' },
    
    { label: 'Purchases', href: '/account/purchases' },
    { label: 'Payments', href: '/account/payments' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <Link href="/account">
        <h1 className="mt-6 sm:mt-8 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
          Account
          <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
        </h1>
      </Link>
      <nav className="flex flex-col sm:flex-row sm:gap-6 border-gray-200 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 sm:px-3 sm:py-2 text-sm font-medium text-center sm:text-left rounded-md sm:rounded-none mb-2 sm:mb-0 transition ${
                isActive
                  ? 'bg-sky-50 text-sky-600 border-b-2 border-sky-600 sm:bg-transparent'
                  : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-b-2 hover:border-sky-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}