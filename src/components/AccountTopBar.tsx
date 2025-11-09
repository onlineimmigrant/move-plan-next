'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSidebar } from '@/context/SidebarContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import widgets to avoid SSR issues
const ChatHelpWidget = dynamic(() => import('@/components/ChatHelpWidget'), { ssr: false });
const UniversalNewButton = dynamic(() => import('@/components/AdminQuickActions/UniversalNewButton'), { ssr: false });

export default function AccountTopBar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar();
  const { settings } = useSettings();
  const { isSuperadmin } = useAuth();
  const pathname = usePathname();
  const logoUrl = settings?.image || '/logo.png';
  
  // Check if we're on admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Check if we're on the main /account page (not sub-pages like /account/profile)
  const isMainAccountPage = pathname === '/account';
  
  // Check if we're on account pages with sidebar (not the main /account page)
  const isAccountPageWithSidebar = pathname?.startsWith('/account/') && pathname !== '/account';
  
  // Show widgets on admin pages or main account page only
  const shouldShowWidgets = isAdminPage || isMainAccountPage;
  
  // Determine if hamburger should be shown:
  // - Admin pages: only for superadmins
  // - Account pages with sidebar (/account/profile, etc): for all users
  // - Main /account page: no hamburger
  const shouldShowHamburger = isAdminPage ? isSuperadmin : isAccountPageWithSidebar;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Left: Menu Toggle & Action Widgets */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu - Only show if shouldShowHamburger is true */}
            {shouldShowHamburger && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`${isAdminPage ? '' : 'lg:hidden'} p-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            )}
            
            {/* Action Widgets - Show on admin pages or main account page */}
            {shouldShowWidgets && (
              <div className="flex items-center gap-2">
                <UniversalNewButton inNavbar />
              </div>
            )}
          </div>

          {/* Center: Empty for now */}
          <div className="flex-1" />

          {/* Right: Logo - Link to home page */}
          <Link
            href="/"
            className="flex items-center text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
          >
            <Image
              src={logoUrl}
              alt="Logo"
              width={40}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>
      
      {/* Chat Widget - Render outside navbar with fixed positioning at top-left */}
      {shouldShowWidgets && <ChatHelpWidget inNavbar />}
    </>
  );
}
