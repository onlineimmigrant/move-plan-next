'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UnifiedMenuProps, MenuItemConfig } from './types';
import { UnifiedMenuButton } from './UnifiedMenuButton';
import { UnifiedMenuDropdown } from './UnifiedMenuDropdown';
import { useMenuPosition } from './hooks/useMenuPosition';
import { useMenuKeyboard } from './hooks/useMenuKeyboard';
import { useUnreadTicketCount } from './hooks/useUnreadTicketCount';
import { useUnreadMeetingsCount } from './hooks/useUnreadMeetingsCount';
import { getMenuItemsForUser } from './config/menuItems';

/**
 * UnifiedMenu Component
 * 
 * Main unified menu system that consolidates all floating action buttons
 * into a single, elegant iOS-style menu with smart positioning
 * 
 * Features:
 * - Glass morphism styling matching MeetingsModals
 * - Smart viewport-aware positioning (dropdown/dropup/left/right)
 * - Permission-based filtering (unauthenticated/authenticated/admin/superadmin)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Badge support for notifications
 * - Mobile responsive with full-screen overlay
 * 
 * @example
 * ```tsx
 * <UnifiedMenu
 *   items={customMenuItems}
 *   position="bottom-right"
 *   onItemClick={(item) => console.log('Clicked:', item.id)}
 * />
 * ```
 */
export function UnifiedMenu({
  items: customItems,
  position = 'bottom-right',
  onItemClick,
  showBadge = true,
  className,
}: UnifiedMenuProps) {
  console.log(`[Debug] UnifiedMenu: render. showBadge=${showBadge}`);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { session, isAdmin, isSuperadmin } = useAuth();
  const isAuthenticated = !!session;

  // Get unread counts for badges
  const unreadTicketCount = useUnreadTicketCount();
  const unreadMeetingsCount = useUnreadMeetingsCount();

  // Get appropriate menu items based on user role
  const baseMenuItems = useMemo(() => {
    const ticketsBadgeGetter = () => (unreadTicketCount > 0 ? unreadTicketCount : null);
    const meetingsBadgeGetter = () => (unreadMeetingsCount > 0 ? unreadMeetingsCount : null);
    const items = customItems || getMenuItemsForUser(
      isAuthenticated, 
      isAdmin, 
      isSuperadmin,
      ticketsBadgeGetter,
      meetingsBadgeGetter
    );
    return items;
  }, [customItems, isAuthenticated, isAdmin, isSuperadmin, unreadTicketCount, unreadMeetingsCount]);

  // Use the menu items directly (already filtered by role)
  const filteredItems = baseMenuItems;

  // Calculate menu position with stable width (280px desktop, 50% mobile)
  const menuPosition = useMenuPosition(buttonRef, isOpen, 280, 400);

  // Handle item selection
  const handleItemClick = (item: MenuItemConfig) => {
    item.action();
    onItemClick?.(item);
    setIsOpen(false);
    setSelectedIndex(0);
    setHoveredIndex(null);
  };

  // Handle menu close
  const handleClose = () => {
    setIsOpen(false);
    setSelectedIndex(0);
    setHoveredIndex(null);
  };

  // Handle button toggle with scroll prevention
  const handleToggle = () => {
    // Prevent any scroll behavior
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    setIsOpen(!isOpen);
    
    // Restore scroll position immediately
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  };

  // Keyboard navigation
  useMenuKeyboard({
    isOpen,
    items: filteredItems,
    selectedIndex,
    setSelectedIndex,
    onItemSelect: handleItemClick,
    onClose: handleClose,
  });

  // Don't render if no items are available after filtering
  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <>
      <UnifiedMenuButton
        ref={buttonRef}
        isOpen={isOpen}
        onClick={handleToggle}
        position={position}
        ticketsBadgeCount={showBadge && unreadTicketCount > 0 ? unreadTicketCount : null}
        meetingsBadgeCount={showBadge && unreadMeetingsCount > 0 ? unreadMeetingsCount : null}
        className={className}
      />

      {isOpen && (
        <UnifiedMenuDropdown
          items={filteredItems}
          position={menuPosition}
          selectedIndex={selectedIndex}
          hoveredIndex={hoveredIndex}
          onItemClick={handleItemClick}
          onHover={setHoveredIndex}
          onClose={handleClose}
        />
      )}
    </>
  );
}
