import { RefObject } from 'react';

/**
 * Scroll a messages container to the bottom
 * 
 * Scrolls the container's scrollTop to its scrollHeight to show the latest messages.
 * Commonly used after sending a message or receiving new messages.
 * 
 * @param containerRef - React ref to the scrollable messages container
 * 
 * @example
 * const messagesContainerRef = useRef<HTMLDivElement>(null);
 * 
 * // Scroll after sending message
 * await handleRespond();
 * scrollToBottom(messagesContainerRef);
 * 
 * @example
 * // Scroll with delay to ensure DOM updates
 * setTimeout(() => scrollToBottom(messagesContainerRef), 100);
 */
export function scrollToBottom(containerRef: RefObject<HTMLDivElement>): void {
  if (containerRef.current) {
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }
}
