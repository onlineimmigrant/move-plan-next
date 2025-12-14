// Menu Items Configuration
// Defines menu items organized by user role with specific ordering

import {
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  PhoneIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ArrowLeftOnRectangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { MenuItemConfig } from '../types';

/**
 * Badge getter function type
 * Used for dynamic badges that need to fetch their value
 */
export type BadgeGetter = () => number | string | null;

/**
 * Menu items for ADMIN and SUPERADMIN users
 * Visual order (top to bottom): Admin → Site → CRM → Email → Appointments → (AI Agent + Support in one row)
 * Array order: Admin, Site, CRM, Email, Appointments, AI Agent, Support (last 2 = bottom row)
 */
export const getAdminMenuItems = (
  unreadTicketsBadge?: BadgeGetter,
  unreadMeetingsBadge?: BadgeGetter,
  unreadEmailsBadge?: BadgeGetter
): MenuItemConfig[] => [
  {
    id: 'admin',
    label: 'Admin',
    icon: Cog6ToothIcon,
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
  {
    id: 'site',
    label: 'Site',
    icon: GlobeAltIcon,
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: UsersIcon,
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
  {
    id: 'email',
    label: 'Email',
    icon: EnvelopeIcon,
    badge: unreadEmailsBadge,
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: VideoCameraIcon,
    badge: unreadMeetingsBadge,
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
  {
    id: 'ai-agent',
    label: 'AI Agent',
    icon: ChatBubbleLeftRightIcon, // Will be replaced with RocketLaunchIcon in component
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
  {
    id: 'support',
    label: 'Support',
    icon: TicketIcon,
    badge: unreadTicketsBadge,
    action: () => {},
    requireAuth: true,
    requireAdmin: true,
  },
];

/**
 * Menu items for AUTHENTICATED (non-admin) users
 * Visual order (top to bottom): Help Center → Account → Appointments → (AI Agent + Support in one row)
 * Array order: Help Center, Account, Appointments, AI Agent, Support (last 2 = bottom row)
 */
export const getAuthenticatedMenuItems = (
  unreadTicketsBadge?: BadgeGetter,
  unreadMeetingsBadge?: BadgeGetter
): MenuItemConfig[] => {
  return [
  {
    id: 'help-center',
    label: 'Help Center',
    icon: QuestionMarkCircleIcon,
    action: () => {},
    requireAuth: true,
    requireAdmin: false,
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserCircleIcon,
    action: () => {},
    requireAuth: true,
    requireAdmin: false,
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: VideoCameraIcon,
    badge: unreadMeetingsBadge,
    action: () => {},
    requireAuth: true,
    requireAdmin: false,
  },
  {
    id: 'ai-agent',
    label: 'AI Agent',
    icon: ChatBubbleLeftRightIcon,
    action: () => {},
    requireAuth: true,
    requireAdmin: false,
  },
  {
    id: 'support',
    label: 'Support',
    icon: TicketIcon,
    badge: unreadTicketsBadge,
    action: () => {},
    requireAuth: true,
    requireAdmin: false,
  },
];
};

/**
 * Menu items for UNAUTHENTICATED users
 * Visual order (top to bottom): Help Center → Sign In → (Chat + Contact in one row)
 * Array order: Help Center, Sign In, Chat, Contact (last 2 = bottom row)
 */
export const UNAUTHENTICATED_MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'help-center',
    label: 'Help Center',
    icon: QuestionMarkCircleIcon,
    action: () => {},
    requireAuth: false,
    requireAdmin: false,
  },
  {
    id: 'sign-in',
    label: 'Sign In',
    icon: ArrowLeftOnRectangleIcon,
    action: () => {},
    requireAuth: false,
    requireAdmin: false,
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: RocketLaunchIcon, // ChatHelpWidget icon
    action: () => {},
    requireAuth: false,
    requireAdmin: false,
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: PhoneIcon,
    action: () => {},
    requireAuth: false,
    requireAdmin: false,
  },
];

/**
 * Get appropriate menu items based on user authentication and role
 */
export function getMenuItemsForUser(
  isAuthenticated: boolean,
  isAdmin: boolean,
  isSuperadmin: boolean,
  unreadTicketsBadge?: BadgeGetter,
  unreadMeetingsBadge?: BadgeGetter,
  unreadEmailsBadge?: BadgeGetter
): MenuItemConfig[] {
  // Admin or Superadmin
  if (isAdmin || isSuperadmin) {
    return getAdminMenuItems(unreadTicketsBadge, unreadMeetingsBadge, unreadEmailsBadge);
  }
  
  // Authenticated regular user
  if (isAuthenticated) {
    return getAuthenticatedMenuItems(unreadTicketsBadge, unreadMeetingsBadge);
  }
  
  // Unauthenticated
  return UNAUTHENTICATED_MENU_ITEMS;
}

/**
 * Legacy default items (deprecated - use getMenuItemsForUser instead)
 */
export const DEFAULT_MENU_ITEMS = getAuthenticatedMenuItems();

/**
 * Get menu items grouped by section (deprecated - no longer used)
 */
export function getMenuItemsBySection(items: MenuItemConfig[]): {
  top: MenuItemConfig[];
  bottom: MenuItemConfig[];
} {
  return items.reduce(
    (acc, item) => {
      if (item.section === 'bottom') {
        acc.bottom.push(item);
      } else {
        acc.top.push(item);
      }
      return acc;
    },
    { top: [] as MenuItemConfig[], bottom: [] as MenuItemConfig[] }
  );
}
