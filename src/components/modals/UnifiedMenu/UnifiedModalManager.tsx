'use client';

import React, { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UnifiedMenu } from './UnifiedMenu';
import { getMenuItemsForUser } from './config/menuItems';
import { MenuItemConfig } from './types';
import { SiteActionsModal } from './SiteActionsModal';

// Lazy load modals for better performance
const MeetingsBookingModal = dynamic(
  () => import('../MeetingsModals/MeetingsBookingModal').then(m => ({ default: m.default })),
  { ssr: false }
);

const MeetingsAdminModal = dynamic(
  () => import('../MeetingsModals/MeetingsAdminModal/MeetingsAdminModal').then(m => ({ default: m.default })),
  { ssr: false }
);

const TicketsAccountModal = dynamic(
  () => import('../TicketsModals/TicketsAccountModal/TicketsAccountModal').then(m => ({ default: m.default })),
  { ssr: false }
);

const TicketsAdminModal = dynamic(
  () => import('../TicketsModals/TicketsAdminModal/TicketsAdminModal').then(m => ({ default: m.default })),
  { ssr: false }
);

const ChatWidget = dynamic(
  () => import('../ChatWidget/ChatWidget').then(m => ({ default: m.default })),
  { ssr: false }
);

const ChatHelpWidget = dynamic(
  () => import('../../ChatHelpWidget').then(m => ({ default: m.default })),
  { ssr: false }
);

const ContactModal = dynamic(
  () => import('../../contact/ContactModal'),
  { ssr: false }
);

const LoginModal = dynamic(
  () => import('../../LoginRegistration/LoginModal').then(m => ({ default: m.default })),
  { ssr: false }
);

const RegisterModal = dynamic(
  () => import('../../LoginRegistration/RegisterModal').then(m => ({ default: m.default })),
  { ssr: false }
);

/**
 * UnifiedModalManager Component
 * 
 * Manages all modals and integrates them with the UnifiedMenu
 * Replaces individual floating buttons with a single unified menu system
 * 
 * Handles role-based menu items:
 * - Admin: Admin page, Site quick actions, Appointments (admin modal), AI Agent (chat widget), Support (admin modal)
 * - Authenticated: Help Center, Account, Appointments (account modal), AI Agent (chat widget), Support (account modal)
 * - Unauthenticated: Help Center, Sign In, Chat widget, Contact
 * 
 * @example
 * ```tsx
 * <UnifiedModalManager />
 * ```
 */
export function UnifiedModalManager() {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const { session, isAdmin, isSuperadmin } = useAuth();
  const isAuthenticated = !!session;
  const isAdminUser = isAdmin || isSuperadmin;

  // Don't show on admin or account pages (they have their own navigation)
  const shouldHide = pathname?.startsWith('/admin') || pathname?.startsWith('/account');
  
  if (shouldHide) {
    return null;
  }

  // Get menu items for current user role
  const baseMenuItems = getMenuItemsForUser(isAuthenticated, isAdmin, isSuperadmin);

  // Create menu items with actual actions
  const menuItems: MenuItemConfig[] = baseMenuItems.map((item) => ({
    ...item,
    action: () => {
      switch (item.id) {
        case 'ai-agent':
          // Open chat widget directly (the actual chat interface)
          setOpenModal('chat');
          break;
        case 'support':
          // Admin gets admin tickets modal, users get account tickets modal
          setOpenModal(isAdminUser ? 'tickets-admin' : 'tickets-account');
          break;
        case 'appointments':
          // Admin gets admin meetings modal, users get account meetings modal
          setOpenModal(isAdminUser ? 'meetings-admin' : 'meetings-account');
          break;
        case 'admin':
          // Prefetch admin route for faster navigation
          router.prefetch('/admin');
          startTransition(() => {
            router.push('/admin');
          });
          break;
        case 'site':
          // Open UniversalNewButton modal
          setOpenModal('site-actions');
          break;
        case 'account':
          // Prefetch account route for faster navigation
          router.prefetch('/account');
          startTransition(() => {
            router.push('/account');
          });
          break;
        case 'contact':
          // TODO: Verify contact modal exists
          setOpenModal('contact');
          break;
        case 'help-center':
          setOpenModal('help');
          break;
        case 'sign-in':
          setOpenModal('login');
          break;
        case 'chat':
          setOpenModal('chat');
          break;
        default:
          console.log('Unknown action:', item.id);
      }
    },
  }));

  return (
    <>
      {/* Loading skeleton during navigation */}
      {isPending && (
        <div className="fixed inset-0 z-[10001] bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 animate-in fade-in duration-200">
          <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-white/20">
              
              {/* Header Skeleton */}
              <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-7 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Content Skeleton */}
              <div className="p-4 sm:p-6 bg-white/20 dark:bg-gray-800/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 flex flex-col items-center justify-center gap-3 animate-pulse"
                    >
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Menu */}
      <UnifiedMenu
        items={menuItems}
        position="bottom-right"
        onItemClick={(item) => {
          console.log('Menu item clicked:', item.id);
        }}
      />

      {/* Admin Modals */}
      {openModal === 'meetings-admin' && (
        <MeetingsAdminModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === 'tickets-admin' && (
        <TicketsAdminModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* Account Modals */}
      {openModal === 'meetings-account' && (
        <MeetingsBookingModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === 'tickets-account' && (
        <TicketsAccountModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* Shared Modals */}
      {openModal === 'chat' && (
        <ChatWidget
          initialOpen={true}
          forceHighZIndex={true}
        />
      )}

      {openModal === 'help' && (
        <ChatHelpWidget inNavbar={false} />
      )}

      {/* Admin Quick Actions */}
      {openModal === 'site-actions' && (
        <SiteActionsModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* Contact Modal */}
      {openModal === 'contact' && (
        <ContactModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* Login Modal */}
      {openModal === 'login' && (
        <LoginModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
          onSwitchToRegister={() => {
            setOpenModal('register');
          }}
        />
      )}

      {/* Register Modal */}
      {openModal === 'register' && (
        <RegisterModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
          onSwitchToLogin={() => {
            setOpenModal('login');
          }}
        />
      )}
    </>
  );
}
