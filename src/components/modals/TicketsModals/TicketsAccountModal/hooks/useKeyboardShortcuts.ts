/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for the modal (Escape to close, Ctrl+Enter to send)
 */

import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  isOpen: boolean;
  responseMessage: string;
  selectedTicket: any;
  isSending: boolean;
  onClose: () => void;
  onSend: () => void;
}

export const useKeyboardShortcuts = ({
  isOpen,
  responseMessage,
  selectedTicket,
  isSending,
  onClose,
  onSend,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Ctrl+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (responseMessage.trim() && selectedTicket && !isSending) {
          onSend();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, responseMessage, selectedTicket, isSending, onClose, onSend]);
};
