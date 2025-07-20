// components/AccountTab.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStudentStatus } from '@/lib/StudentContext';
import Loading from '@/ui/Loading';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useRef, useEffect, useState } from 'react';

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
  const { t } = useAccountTranslations();
  const [sliderStyle, setSliderStyle] = useState({ width: 0, transform: 'translateX(0px)' });
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const tabs: Tab[] = [
    ...(isStudent ? [{ label: t.student, href: '/account/edupro' }] : []),
    { label: t.profile, href: '/account/profile' },
    { label: t.purchases, href: '/account/purchases' },
  ];

  // Calculate slider position and width based on actual tab dimensions
  useEffect(() => {
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      const activeIndex = tabs.findIndex((tab) => pathname === tab.href);
      if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
        const activeTab = tabRefs.current[activeIndex];
        if (activeTab) {
          const { offsetLeft, offsetWidth } = activeTab;
          setSliderStyle({
            width: offsetWidth - 4, // Account for padding
            transform: `translateX(${offsetLeft + 2}px)` // Account for padding
          });
        }
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [pathname, tabs.length, isStudent]); // Fixed: Added dependency array

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <Link href="/account">
        <h1 className="mt-0 sm:mt-2 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
          {t.account}
          <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
        </h1>
      </Link>
      <div className="select-none flex justify-center pb-2">
        <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-sky-600 rounded-lg cursor-pointer overflow-hidden px-0.5">
          {/* Sliding Background */}
          <div
            className="absolute top-0.5 bottom-0.5 bg-sky-600 rounded-md transition-all duration-200 ease-in-out"
            style={sliderStyle}
          ></div>
          {/* Tab Labels */}
          <div className="relative flex h-full" role="tablist" aria-label="Account Tabs">
            {tabs.map((tab, index) => (
              <Link
                key={tab.href}
                ref={(el) => { tabRefs.current[index] = el; }}
                href={tab.href}
                className={`flex-1 flex justify-center items-center text-sky-600 text-sm sm:text-sm  font-medium mona-sans px-0.5 ${
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