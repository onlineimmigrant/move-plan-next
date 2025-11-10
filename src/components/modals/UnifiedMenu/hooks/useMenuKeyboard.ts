// useMenuKeyboard Hook
// Handles keyboard navigation for the unified menu

import { useEffect, useCallback } from 'react';
import { MenuItemConfig } from '../types';

interface UseMenuKeyboardProps {
  isOpen: boolean;
  items: MenuItemConfig[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onItemSelect: (item: MenuItemConfig) => void;
  onClose: () => void;
}

/**
 * Hook to handle keyboard navigation in the menu
 * Supports: Arrow keys, Enter, Escape, Home, End
 */
export function useMenuKeyboard({
  isOpen,
  items,
  selectedIndex,
  setSelectedIndex,
  onItemSelect,
  onClose,
}: UseMenuKeyboardProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(Math.min(selectedIndex + 1, items.length - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
          break;

        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setSelectedIndex(items.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            onItemSelect(items[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    },
    [isOpen, items, selectedIndex, setSelectedIndex, onItemSelect, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  return { handleKeyDown };
}
