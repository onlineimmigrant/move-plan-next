/**
 * useMarkAsReadEffects Hook
 * Manages multiple effects for marking messages as read
 * Handles typing detection, periodic checks, and visibility changes
 */

import { useEffect } from 'react';

interface UseMarkAsReadEffectsProps {
  isOpen: boolean;
  responseMessage: string;
  selectedTicketId: string | undefined;
  markMessagesAsRead: (ticketId: string) => Promise<void>;
}

export const useMarkAsReadEffects = ({
  isOpen,
  responseMessage,
  selectedTicketId,
  markMessagesAsRead,
}: UseMarkAsReadEffectsProps) => {
  
  // Mark messages as read when user starts typing (indicates they're actively viewing)
  useEffect(() => {
    if (responseMessage && selectedTicketId && isOpen) {
      markMessagesAsRead(selectedTicketId);
    }
  }, [responseMessage, selectedTicketId, isOpen, markMessagesAsRead]);

  // Mark messages as read periodically while ticket is open and modal is visible
  useEffect(() => {
    if (!selectedTicketId || !isOpen) return;

    const markAsReadInterval = setInterval(() => {
      // Only mark as read if:
      // 1. Document has focus (tab is active)
      // 2. Modal is open (isOpen = true)
      // 3. Page is visible (not minimized or in background tab)
      if (document.hasFocus() && isOpen && !document.hidden) {
        markMessagesAsRead(selectedTicketId);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(markAsReadInterval);
  }, [selectedTicketId, isOpen, markMessagesAsRead]);

  // Mark messages as read when user returns to the tab/window
  useEffect(() => {
    if (!selectedTicketId || !isOpen) return;

    const handleVisibilityChange = () => {
      // When user switches back to this tab, mark messages as read
      if (!document.hidden && isOpen) {
        markMessagesAsRead(selectedTicketId);
      }
    };

    const handleFocus = () => {
      // When window gains focus, mark messages as read
      if (!document.hidden && isOpen) {
        markMessagesAsRead(selectedTicketId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedTicketId, isOpen, markMessagesAsRead]);
};
