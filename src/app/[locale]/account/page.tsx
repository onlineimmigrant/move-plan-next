'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Toast from '@/components/Toast';
import { useStudentStatus } from '@/lib/StudentContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { SidebarProvider } from '@/context/SidebarContext';
import AccountTopBar from '@/components/AccountTopBar';
import Loading from '@/ui/Loading';
import { AccountModalCard, AccountLinkCard } from '@/components/account/AccountCards';
import {
  AcademicCapIcon,
  UserIcon,
  RocketLaunchIcon,
  VideoCameraIcon,
  TicketIcon,
  ArrowsRightLeftIcon,
  UserCircleIcon as UserCircleIconOutline,
} from '@heroicons/react/24/outline';
import { UserCircleIcon as UserCircleIconSolid } from '@heroicons/react/24/solid';
import ChatWidget from '@/components/modals/ChatWidget/ChatWidget';
import TicketsAccountModal from '@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountModal';
import MeetingsBookingModal from '@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logger } from '@/lib/logger';

// TypeScript interfaces for component props
interface DashboardLinkItem {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  href?: string;
  tooltip: string;
  onClick?: () => void;
  isModal?: boolean;
}

interface PrimaryColors {
  base: string;
  lighter: string;
}

export default function AccountPage() {
  const { session, isAdmin, fullName, isLoading, error } = useAuth();
  const { isStudent, isLoading: studentLoading } = useStudentStatus();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useAccountTranslations();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { settings } = useSettings();
  const logoUrl = settings?.image || '/logo.png';

  const combinedLoading = isLoading || studentLoading;

  useEffect(() => {
    if (error) {
      logger.error('Account page error:', error);
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  // Memoized modal handlers
  const handleOpenTicketsModal = useCallback(() => {
    logger.debug('Opening tickets modal');
    setIsTicketsModalOpen(true);
  }, []);

  const handleCloseTicketsModal = useCallback(() => {
    logger.debug('Closing tickets modal');
    setIsTicketsModalOpen(false);
  }, []);

  const handleOpenMeetingsModal = useCallback(() => {
    logger.debug('Opening meetings modal');
    setIsMeetingsModalOpen(true);
  }, []);

  const handleCloseMeetingsModal = useCallback(() => {
    logger.debug('Closing meetings modal');
    setIsMeetingsModalOpen(false);
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast(null);
  }, []);

  // Memoize dashboard links - MUST be called before any conditional returns
  const dashboardLinks = useMemo<DashboardLinkItem[]>(() => [
    ...(isStudent
      ? [
          {
            label: t.student,
            icon: AcademicCapIcon,
            href: '/account/edupro',
            tooltip: t.learningPlatform,
          },
        ]
      : []),
    {
      label: t.profile,
      icon: UserIcon,
      href: '/account/profile',
      tooltip: 'Profile, Purchases, Payments & More',
    },
    {
      label: t.ai,
      icon: RocketLaunchIcon,
      href: '/account/ai',
      tooltip: t.defineAiModel,
    },
    {
      label: 'Appointments',
      icon: VideoCameraIcon,
      tooltip: 'Book and manage meetings',
      onClick: handleOpenMeetingsModal,
      isModal: true,
    },
    {
      label: 'Tickets',
      icon: TicketIcon,
      tooltip: 'Support Tickets',
      onClick: handleOpenTicketsModal,
      isModal: true,
    },
    ...(isAdmin
      ? [
          {
            label: t.admin,
            icon: ArrowsRightLeftIcon,
            href: '/admin',
            tooltip: t.dashboard,
          },
        ]
      : []),
  ], [isStudent, isAdmin, t, handleOpenMeetingsModal, handleOpenTicketsModal]);

  // Conditional returns AFTER all hooks
  if (combinedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Loading account page">
        <Loading />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="alert">
        <p className="text-red-600 font-medium">{t.pleaseLogin}</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AccountTopBar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8" role="main" aria-label="Account dashboard">
        <div className="max-w-7xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-white/20">
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={handleCloseToast}
              aria-live="polite"
            />
          )}
        
          {/* Modal-style Header */}
          <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
            <UserCircleIconSolid className="w-6 h-6 flex-shrink-0" style={{ color: primary.base }} />
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              {t.account}
            </h1>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-8 lg:p-12">
            {/* Dashboard Cards */}
            <nav className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Account navigation">
              {dashboardLinks.map((item) => (
                item.isModal ? (
                  <AccountModalCard 
                    key={item.label} 
                    item={item} 
                    primary={primary}
                  />
                ) : (
                  <AccountLinkCard 
                    key={item.href} 
                    item={item} 
                    pathname={pathname} 
                    primary={primary}
                  />
                )
              ))}
            </nav>

            {/* Helper Text and Welcome Message */}
            {pathname === '/account' && (
              <div className="mt-12 text-center space-y-4" role="complementary">
                <div className="inline-block bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 px-6 py-3">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {t.selectCard}
                  </p>
                </div>
                {fullName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.hello}, {fullName}
                  </p>
                )}
              </div>
            )}
          </div>
        
        <MeetingsBookingModal 
          isOpen={isMeetingsModalOpen} 
          onClose={handleCloseMeetingsModal}
        />
        <TicketsAccountModal 
          isOpen={isTicketsModalOpen} 
          onClose={handleCloseTicketsModal}
        />
      </div>
    </main>
    </SidebarProvider>
  );
}