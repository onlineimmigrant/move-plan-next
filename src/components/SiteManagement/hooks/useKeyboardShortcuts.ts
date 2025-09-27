import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsProps {
  onSave: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({ onSave, onClose, disabled = false }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    // Check if we're in an input field
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true';

    // Ctrl+S or Cmd+S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      onSave();
      return;
    }

    // Escape to close (only if not in input field)
    if (event.key === 'Escape' && !isInputField) {
      event.preventDefault();
      onClose();
      return;
    }
  }, [onSave, onClose, disabled]);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);

  // Return the shortcuts for display in UI
  const shortcuts = {
    save: navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S',
    close: 'Esc'
  };

  return { shortcuts };
}
