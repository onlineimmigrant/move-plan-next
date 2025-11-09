'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  ArrowLeftIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useSettings } from '@/context/SettingsContext';
import { useSidebar } from '@/context/SidebarContext';

interface SubItem {
  label: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
}

interface SidebarItem {
  label: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
  subItems?: SubItem[];
}

export default function AccountSidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  const logoUrl = settings?.image || '/logo.png';
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);

  // Auto-expand Payments accordion if on a payments-related page
  useEffect(() => {
    if (pathname?.includes('/account/profile/payments')) {
      setIsPaymentsOpen(true);
    }
  }, [pathname]);

  const sidebarItems: SidebarItem[] = [
    {
      label: t.profile,
      href: '/account/profile',
      icon: UserIcon,
      tooltip: t.personalInfo
    },
    {
      label: t.purchases,
      href: '/account/profile/purchases',
      icon: ShoppingBagIcon,
      tooltip: t.list
    },
    {
      label: 'Files',
      href: '/account/files',
      icon: DocumentTextIcon,
      tooltip: 'File Management'
    },
    {
      label: t.payments,
      href: '/account/profile/payments',
      icon: CreditCardIcon,
      tooltip: t.list,
      subItems: [
        {
          label: t.billing,
          href: '/account/profile/payments/billing',
          icon: DocumentTextIcon,
          tooltip: t.billingAccountManagement
        },
        {
          label: t.receipts,
          href: '/account/profile/payments/receipts',
          icon: ReceiptPercentIcon,
          tooltip: t.list
        }
      ]
    }
  ];

  const SidebarContent = () => (
    <>
      {/* Account Parent Link - moved to top */}
      <div className="p-4 ">
        <Link
          href="/account"
          onClick={() => setIsMobileMenuOpen(false)}
          className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/30 hover:shadow-md"
          style={{
            borderLeft: pathname === '/account' ? `3px solid ${primary.base}` : '3px solid transparent'
          }}
        >
          <ArrowLeftIcon 
            className="h-5 w-5 flex-shrink-0 transition-colors"
            style={{
              color: pathname === '/account' ? primary.base : undefined
            }}
          />
          <span
            className="text-base font-bold transition-colors text-gray-900 dark:text-white"
            style={{
              color: pathname === '/account' ? primary.base : undefined
            }}
          >
            {t.account}
          </span>
        </Link>
      </div>

      {/* Divider */}
      <div className="px-4">
        <div className="border-t border-white/20 dark:border-gray-700/30"></div>
      </div>

   

      {/* Navigation Items */}
      <nav className="flex-1 px-4 pb-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isParentActive = pathname?.startsWith(item.href);

          return (
            <div key={item.href}>
              {/* Main Item */}
              {hasSubItems ? (
                <button
                  onClick={() => {
                    setIsPaymentsOpen(!isPaymentsOpen);
                    // Don't close mobile menu when toggling accordion
                  }}
                  className="w-full group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: isParentActive ? `${primary.lighter}40` : 'transparent'
                  }}
                  title={item.tooltip}
                >
                  <Icon
                    className="h-5 w-5 flex-shrink-0 transition-colors"
                    style={{
                      color: isParentActive ? primary.base : undefined
                    }}
                  />
                  <span
                    className="flex-1 text-left text-sm font-medium transition-colors text-gray-900 dark:text-white"
                    style={{
                      color: isParentActive ? primary.base : undefined
                    }}
                  >
                    {item.label}
                  </span>
                  <ChevronDownIcon
                    className="h-4 w-4 transition-transform duration-200"
                    style={{
                      transform: isPaymentsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: isParentActive ? primary.base : undefined
                    }}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? `${primary.lighter}40` : 'transparent'
                  }}
                  title={item.tooltip}
                >
                  <Icon
                    className="h-5 w-5 flex-shrink-0 transition-colors"
                    style={{
                      color: isActive ? primary.base : undefined
                    }}
                  />
                  <span
                    className="text-sm font-medium transition-colors text-gray-900 dark:text-white"
                    style={{
                      color: isActive ? primary.base : undefined
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              )}

              {/* Sub Items (Accordion Content) */}
              {hasSubItems && isPaymentsOpen && (
                <div className="mt-1 ml-4 pl-4 border-l-2 space-y-1" style={{ borderColor: `${primary.lighter}60` }}>
                  {item.subItems!.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    const SubIcon = subItem.icon;

                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm"
                        style={{
                          backgroundColor: isSubActive ? `${primary.lighter}30` : 'transparent'
                        }}
                        title={subItem.tooltip}
                      >
                        <SubIcon
                          className="h-4 w-4 flex-shrink-0 transition-colors"
                          style={{
                            color: isSubActive ? primary.base : undefined
                          }}
                        />
                        <span
                          className="text-sm transition-colors text-gray-700 dark:text-gray-300"
                          style={{
                            color: isSubActive ? primary.base : undefined,
                            fontWeight: isSubActive ? '500' : '400'
                          }}
                        >
                          {subItem.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 mt-16"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-white/20 dark:border-gray-700/30 h-screen sticky top-16">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-r border-white/20 dark:border-gray-700/30 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
