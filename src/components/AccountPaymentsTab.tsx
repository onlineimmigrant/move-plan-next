// components/AccountTab.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStudentStatus } from '@/lib/StudentContext';
import Loading from '@/ui/Loading';

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
    ...(isStudent ? [{ label: 'Purchases', href: '/account/purchases' }] : []),
     { label: 'Payments', href: '/account/payments' },
    { label: 'Billing', href: '/account/payments/billing' }
   
  ];

  // Determine the translate-x for the sliding background based on the number of tabs
  const getSliderPosition = () => {
    const activeIndex = tabs.findIndex((tab) => pathname === tab.href);
    console.log('Active Tab Index:', activeIndex, 'Pathname:', pathname, 'Number of Tabs:', tabs.length); // Debug log

    if (tabs.length === 2) {
      if (activeIndex === 0) return 'translate-x-0';
      if (activeIndex === 1) return 'translate-x-[100%]';
    } else if (tabs.length === 3) {
      if (activeIndex === 0) return 'translate-x-0';
      if (activeIndex === 1) return 'translate-x-[100%]';
      if (activeIndex === 2) return 'translate-x-[200%]';
    }
    return 'translate-x-0'; // Default to first tab
  };

  // Determine the sliding background width based on the number of tabs
  const getSliderWidth = () => {
    return tabs.length === 2 ? 'w-[calc(50%-2px)]' : 'w-[calc(33.33%-2px)]';
  };

  if (isLoading) {
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
  }


  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <Link href="/account">
        <h1 className="mt-0 sm:mt-2 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
          Account
          <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
        </h1>
      </Link>
      <div className="select-none flex justify-center pb-2">
        <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-sky-600 rounded-lg cursor-pointer overflow-hidden px-0.5">
          {/* Sliding Background */}
          <div
            className={`absolute top-0.5 bottom-0.5 left-0.5 ${getSliderWidth()} bg-sky-600 rounded-md transition-transform duration-200 ease-in-out transform ${getSliderPosition()}`}
          ></div>
          {/* Tab Labels */}
          <div className="relative flex h-full" role="tablist" aria-label="Account Tabs">
            {tabs.map((tab, index) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex justify-center items-center text-sky-600 text-sm sm:text-sm font-medium mona-sans px-0.5 ${
                  pathname === tab.href ? 'font-semibold text-white z-10' : ''
                }`}
                role="tab"
                aria-selected={pathname === tab.href}
                aria-current={pathname === tab.href ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}