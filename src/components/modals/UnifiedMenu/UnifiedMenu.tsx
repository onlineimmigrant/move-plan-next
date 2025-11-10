'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UnifiedMenuProps, MenuItemConfig } from './types';
import { UnifiedMenuButton } from './UnifiedMenuButton';
import { UnifiedMenuDropdown } from './UnifiedMenuDropdown';
import { useMenuPosition } from './hooks/useMenuPosition';
import { useMenuKeyboard } from './hooks/useMenuKeyboard';
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { session, isAdmin, isSuperadmin } = useAuth();
  const isAuthenticated = !!session;

  // Get appropriate menu items based on user role
  const baseMenuItems = customItems || getMenuItemsForUser(isAuthenticated, isAdmin, isSuperadmin);

  // Use the menu items directly (already filtered by role)
  const filteredItems = baseMenuItems;

  // Calculate menu position with stable width (200px desktop, 50% mobile)
  const menuPosition = useMenuPosition(buttonRef, isOpen, 200, 400);

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

  // Keyboard navigation
  useMenuKeyboard({
    isOpen,
    items: filteredItems,
    selectedIndex,
    setSelectedIndex,
    onItemSelect: handleItemClick,
    onClose: handleClose,
  });

  // Calculate total badge count from all items
  const totalBadgeCount = useMemo(() => {
    if (!showBadge) return null;

    let total = 0;
    filteredItems.forEach((item) => {
      const badgeValue = typeof item.badge === 'function' ? item.badge() : item.badge;
      if (typeof badgeValue === 'number') {
        total += badgeValue;
      }
    });

    return total > 0 ? total : null;
  }, [filteredItems, showBadge]);

  // Don't render if no items are available after filtering
  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <>
      <UnifiedMenuButton
        ref={buttonRef}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        position={position}
        badgeCount={totalBadgeCount}
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
