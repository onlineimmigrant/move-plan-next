import { useState, useRef } from 'react';
import { SubMenuItem } from '@/types/menu';

/**
 * Manages menu state for Header component
 * Handles mobile menu, submenus, hover states, and timeouts
 */
export const useMenuState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [hoveredSubmenuItem, setHoveredSubmenuItem] = useState<SubMenuItem | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancelCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const closeSubmenuWithDelay = () => {
    cancelCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenSubmenu(null);
      setHoveredSubmenuItem(null);
    }, 200);
  };

  return {
    isOpen,
    setIsOpen,
    openSubmenu,
    setOpenSubmenu,
    hoveredSubmenuItem,
    setHoveredSubmenuItem,
    closeTimeoutRef,
    cancelCloseTimeout,
    closeSubmenuWithDelay,
  };
};
