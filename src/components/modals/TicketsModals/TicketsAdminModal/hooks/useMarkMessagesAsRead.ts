import { useEffect } from 'react';

interface MarkMessagesAsReadConfig {
  selectedTicketId: string | undefined;
  isOpen: boolean;
  responseMessage?: string;
  noteText?: string;
  markAsRead: (ticketId: string) => void;
}

/**
 * Custom hook to manage marking messages as read based on various triggers
 * Consolidates multiple useEffects that mark messages as read
 */
export function useMarkMessagesAsRead(config: MarkMessagesAsReadConfig): void {
  const { selectedTicketId, isOpen, responseMessage, noteText, markAsRead } = config;

  // Mark messages as read when admin starts typing (indicates they're actively viewing)
  useEffect(() => {
    if (responseMessage && selectedTicketId && isOpen) {
      markAsRead(selectedTicketId);
    }
  }, [responseMessage, isOpen, selectedTicketId, markAsRead]);

  // Mark messages as read when admin adds internal notes (active engagement)
  useEffect(() => {
    if (noteText && selectedTicketId && isOpen) {
      markAsRead(selectedTicketId);
    }
  }, [noteText, isOpen, selectedTicketId, markAsRead]);

  // Removed: Periodic polling was causing infinite loop
  // Messages are now marked as read when:
  // 1. Ticket is selected (handleTicketSelect)
  // 2. Admin starts typing a response
  // 3. Admin adds internal notes
  // 4. New messages arrive (useAutoScroll)

  // Mark messages as read when user returns to the tab/window
  useEffect(() => {
    if (!selectedTicketId || !isOpen) return;

    const handleVisibilityChange = () => {
      // When user switches back to this tab, mark messages as read
      if (!document.hidden && isOpen) {
        markAsRead(selectedTicketId);
      }
    };

    const handleFocus = () => {
      // When window gains focus, mark messages as read
      if (!document.hidden && isOpen) {
        markAsRead(selectedTicketId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedTicketId, isOpen, markAsRead]);
}
