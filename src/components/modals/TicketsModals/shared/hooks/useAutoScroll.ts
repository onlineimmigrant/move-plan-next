import { useEffect, RefObject, MutableRefObject } from 'react';

interface AutoScrollConfig {
  selectedTicketId: string | undefined;
  responseCount: number | undefined;
  isOpen: boolean;
  messagesContainerRef: RefObject<HTMLDivElement>;
  prevResponseCountRef: MutableRefObject<number>;
  onMessagesRead?: (ticketId: string) => void;
}

/**
 * Custom hook to manage auto-scrolling and message read tracking
 * Scrolls to bottom when new responses are added and marks messages as read
 */
export function useAutoScroll(config: AutoScrollConfig): void {
  const {
    selectedTicketId,
    responseCount,
    isOpen,
    messagesContainerRef,
    prevResponseCountRef,
    onMessagesRead
  } = config;

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Reset response count when ticket changes
  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100);
    if (responseCount !== undefined) {
      prevResponseCountRef.current = responseCount;
    }
  }, [selectedTicketId, responseCount, prevResponseCountRef]);

  // Scroll when NEW responses are added (not on every update)
  useEffect(() => {
    if (responseCount !== undefined) {
      const currentCount = responseCount;
      const prevCount = prevResponseCountRef.current;
      
      // Only scroll if responses were added (not updated)
      if (currentCount > prevCount) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        prevResponseCountRef.current = currentCount;
        
        // Mark as read when new messages arrive
        if (selectedTicketId && isOpen && onMessagesRead) {
          onMessagesRead(selectedTicketId);
        }
      }
    }
  }, [responseCount, isOpen, selectedTicketId, onMessagesRead, prevResponseCountRef]);
}
