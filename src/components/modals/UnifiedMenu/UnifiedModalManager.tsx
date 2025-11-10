'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UnifiedMenu } from './UnifiedMenu';
import { getMenuItemsForUser } from './config/menuItems';
import { MenuItemConfig } from './types';

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

const UniversalNewButton = dynamic(
  () => import('../../AdminQuickActions/UniversalNewButton'),
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
 * - Unauthenticated: Help Center, Chat widget, Contact
 * 
 * @example
 * ```tsx
 * <UnifiedModalManager />
 * ```
 */
export function UnifiedModalManager() {
  const [openModal, setOpenModal] = useState<string | null>(null);
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
          router.push('/admin');
          break;
        case 'site':
          // Open UniversalNewButton modal
          setOpenModal('site-actions');
          break;
        case 'account':
          router.push('/account');
          break;
        case 'contact':
          // TODO: Verify contact modal exists
          setOpenModal('contact');
          break;
        case 'help-center':
          setOpenModal('help');
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
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            onClick={() => setOpenModal(null)}
          />
          {/* Button positioned in bottom-right */}
          <div className="fixed bottom-20 right-4 z-[9999]">
            <UniversalNewButton />
          </div>
        </>
      )}

      {/* TODO: Add Contact modal when verified */}
      {openModal === 'contact' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">Contact modal - to be implemented</p>
            <button
              onClick={() => setOpenModal(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
