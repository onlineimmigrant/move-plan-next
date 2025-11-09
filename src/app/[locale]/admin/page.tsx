'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Loading from '@/ui/Loading';
import {
  DevicePhoneMobileIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  CogIcon, 
  ChatBubbleLeftIcon, 
  ArrowsRightLeftIcon,
  RocketLaunchIcon,
  VideoCameraIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import MeetingsAdminModal from '@/components/modals/MeetingsModals/MeetingsAdminModal/MeetingsAdminModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logger } from '@/lib/logger';
import { 
  AdminModalCard, 
  AdminLinkCard, 
  type ModalCardItem as AdminModalCardItem, 
  type NavigationCardItem as AdminNavigationCardItem 
} from '@/components/admin/AdminCards';

// TypeScript interfaces for component props
interface PrimaryColors {
  base: string;
  lighter: string;
}

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const { session, isLoading } = useAuth();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Memoized modal handlers
  const handleOpenMeetingsModal = useCallback(() => {
    logger.debug('Opening meetings admin modal');
    setIsMeetingsModalOpen(true);
  }, []);

  const handleCloseMeetingsModal = useCallback(() => {
    logger.debug('Closing meetings admin modal');
    setIsMeetingsModalOpen(false);
  }, []);

  // The layout already handles auth checks, no need to duplicate
  // Just show loading while AuthContext is initializing
  if (isLoading) {
    logger.debug('Admin page loading - waiting for auth');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" role="status" aria-label="Loading admin dashboard">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 shadow-2xl border border-white/30 dark:border-gray-700/30">
          <Loading />
        </div>
      </div>
    );
  }

  const dashboardLinks: (AdminNavigationCardItem | AdminModalCardItem)[] = useMemo(() => [
    { href: '/admin/site/management', label: 'Site', icon: DevicePhoneMobileIcon, tooltip: 'Site Management' },
    { href: '/admin/products/management', label: 'Products', icon: ArchiveBoxIcon, tooltip: 'Product Management' },
    { href: '/admin/pricingplans/management', label: 'Pricing Plans', icon: CurrencyDollarIcon, tooltip: 'Price Management' },
    { 
      onClick: handleOpenMeetingsModal, 
      label: 'Appointments', 
      icon: VideoCameraIcon, 
      tooltip: 'Manage Appointments',
      id: 'meetings-modal',
      isModal: true
    } as AdminModalCardItem,
    //{ href: '/admin/reports/custom', label: 'Reports', icon: ChartBarIcon, tooltip: 'Standard and Custom' },
    { href: '/admin/ai/management', label: 'AI', icon: RocketLaunchIcon, tooltip: 'AI Models' },
    { href: '/admin/site-management', label: 'Settings', icon: Cog6ToothIcon, tooltip:'Website Management' },
    { href: '/admin/tickets/management', label: 'Tickets', icon: ChatBubbleLeftIcon, tooltip: 'Contact Management' },
    { href: '/account', label: 'Account', icon: ArrowsRightLeftIcon, tooltip: 'Personal' },
  ], [handleOpenMeetingsModal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-white/20">
        
        {/* Modal-style Header */}
        <header className="flex items-center gap-3 p-4 sm:p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
          <CommandLineIcon className="w-6 h-6 flex-shrink-0" style={{ color: primary.base }} aria-hidden="true" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-8 lg:p-12" role="main" aria-label="Admin dashboard content">
          <nav className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Admin navigation">
          {dashboardLinks.map((item) => {
            // Check if this is a modal trigger or regular link
            if ('isModal' in item && item.isModal) {
              return <AdminModalCard key={item.id} item={item as AdminModalCardItem} primary={primary} />;
            }
            
            // Regular navigation link
            return <AdminLinkCard key={item.href} item={item as AdminNavigationCardItem} pathname={pathname} primary={primary} />;
          })}
        </nav>
        </main>
      </div>
      
      {/* Meetings Admin Modal - Outside container for proper positioning */}
      <MeetingsAdminModal
        isOpen={isMeetingsModalOpen}
        onClose={handleCloseMeetingsModal}
      />
    </div>
  );
}