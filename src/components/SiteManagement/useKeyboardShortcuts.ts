import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onCreateNew: () => void;
  onFocusSearch: () => void;
  onEscape: () => void;
}

export function useKeyboardShortcuts({ onCreateNew, onFocusSearch, onEscape }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.key === 'Escape') {
          (event.target as HTMLElement).blur();
          onEscape();
        }
        return;
      }

      // Check for meta key (Cmd on Mac, Ctrl on Windows/Linux)
      const isMetaKey = event.metaKey || event.ctrlKey;

      // Keyboard shortcuts
      if (isMetaKey && event.key === 'n') {
        event.preventDefault();
        onCreateNew();
      } else if (isMetaKey && event.key === 'f') {
        event.preventDefault();
        onFocusSearch();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCreateNew, onFocusSearch, onEscape]);
}
