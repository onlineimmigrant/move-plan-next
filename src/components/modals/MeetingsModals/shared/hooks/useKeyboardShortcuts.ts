/**
 * Custom hook for keyboard shortcuts in Meetings modals
 * Provides consistent keyboard navigation across all modals
 * 
 * @example
 * ```tsx
 * const handleClose = () => setIsOpen(false);
 * const handleSubmit = () => submitForm();
 * 
 * useKeyboardShortcuts({
 *   onEscape: handleClose,
 *   onEnter: handleSubmit,
 *   enabled: isOpen
 * });
 * ```
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutOptions {
  /**
   * Callback when ESC key is pressed
   * Typically used to close modals
   */
  onEscape?: () => void;
  
  /**
   * Callback when Enter key is pressed
   * Typically used to submit forms or confirm actions
   */
  onEnter?: () => void;
  
  /**
   * Callback when CMD/CTRL + K is pressed
   * Typically used to open search or command palette
   */
  onSearch?: () => void;
  
  /**
   * Whether keyboard shortcuts are enabled
   * Useful to disable shortcuts when modal is not visible
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean;
}

/**
 * Hook that manages keyboard shortcuts for accessibility
 * 
 * @param options - Configuration for keyboard shortcuts
 * 
 * @remarks
 * - ESC key: Close/cancel action
 * - Enter key: Confirm/submit action (not in textareas)
 * - CMD/CTRL + K: Search/command palette
 * 
 * Shortcuts respect form input focus and won't trigger
 * Enter in textareas or when contentEditable is active.
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const {
    onEscape,
    onEnter,
    onSearch,
    enabled = true,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isTextInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true';

      // ESC key - always works
      if (event.key === 'Escape' && onEscape) {
        if (preventDefault) event.preventDefault();
        onEscape();
        return;
      }

      // Enter key - only when not in textarea
      if (event.key === 'Enter' && onEnter) {
        // Don't trigger in textareas or with modifier keys
        if (target.tagName === 'TEXTAREA' || event.shiftKey || event.ctrlKey || event.metaKey) {
          return;
        }
        
        // Allow Enter in regular inputs (form submission)
        if (target.tagName === 'INPUT') {
          const inputType = (target as HTMLInputElement).type;
          // Don't prevent Enter in buttons
          if (inputType === 'button' || inputType === 'submit') {
            return;
          }
        }
        
        if (preventDefault) event.preventDefault();
        onEnter();
        return;
      }

      // CMD/CTRL + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && onSearch) {
        if (preventDefault) event.preventDefault();
        onSearch();
        return;
      }
    },
    [enabled, onEscape, onEnter, onSearch, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
