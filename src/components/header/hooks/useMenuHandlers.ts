import { useCallback } from 'react';
import { SubMenuItem } from '@/types/menu';

interface UseMenuHandlersProps {
  setOpenSubmenu: (id: number | null) => void;
  setHoveredSubmenuItem: (item: SubMenuItem | null) => void;
  cancelCloseTimeout: () => void;
  closeSubmenuWithDelay: () => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Provides memoized handlers for menu interactions
 * Optimized for performance with useCallback
 */
export const useMenuHandlers = ({
  setOpenSubmenu,
  setHoveredSubmenuItem,
  cancelCloseTimeout,
  closeSubmenuWithDelay,
  setIsOpen,
}: UseMenuHandlersProps) => {
  const handleMenuEnter = useCallback((menuId: number, hasSubmenu: boolean) => {
    cancelCloseTimeout();
    if (hasSubmenu) {
      setOpenSubmenu(menuId);
    }
  }, [cancelCloseTimeout, setOpenSubmenu]);

  const handleMenuLeave = useCallback(() => {
    closeSubmenuWithDelay();
  }, [closeSubmenuWithDelay]);

  const handleSubmenuItemHover = useCallback((item: SubMenuItem) => {
    setHoveredSubmenuItem(item);
  }, [setHoveredSubmenuItem]);

  const toggleMobileMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, [setIsOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return {
    handleMenuEnter,
    handleMenuLeave,
    handleSubmenuItemHover,
    toggleMobileMenu,
    closeMobileMenu,
  };
};
