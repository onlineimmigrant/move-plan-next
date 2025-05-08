'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define the tab type
interface Tab {
  label: string;
  href: string;
}

interface AccountTabProps {
  className?: string;
}

const tabs: Tab[] = [
  { label: 'Profile', href: '/account/profile' },
  { label: 'Purchases', href: '/account/purchases' },
  { label: 'Payments', href: '/account/payments' },
  { label: 'Customer Portal', href: '/account/customer-portal' },
];

export default function AccountTab({ className = '' }: AccountTabProps) {
  const pathname = usePathname();

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Header Section */}
      <Link href="/account">
        <h1 className="mt-6 sm:mt-8 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
          Account
          <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full shadow-sm" />
        </h1>
      </Link>

      {/* Tab Navigation */}
      <nav className="flex flex-col sm:flex-row sm:space-x-6 border-gray-200 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`block px-4 py-3 sm:px-3 sm:py-2 text-sm font-medium text-center sm:text-left transition duration-150 ease-in-out rounded-md sm:rounded-none ${
                isActive
                  ? 'bg-sky-50 text-sky-600  border-sky-600 shadow-sm sm:bg-transparent border-b-2 sm:border-sky-600 sm:shadow-none'
                  : 'bg-gray-50 text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-b-2 hover:border-sky-200 active:scale-95 sm:bg-transparent sm:hover:bg-transparent sm:hover:border-b-2 sm:hover:border-sky-200 sm:active:scale-100'
              } mb-2 sm:mb-0`}
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