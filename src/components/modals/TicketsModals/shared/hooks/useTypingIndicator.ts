import { useEffect, MutableRefObject } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface TypingIndicatorConfig {
  isOpen: boolean;
  ticketId: string | undefined;
  onTypingStart: () => void;
  onTypingStop: () => void;
  typingTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  /**
   * Which role's typing to show
   * - 'admin': Show when admin is typing (for customer modal)
   * - 'customer': Show when customer is typing (for admin modal)
   */
  showTypingFrom: 'admin' | 'customer';
}

/**
 * Custom hook to manage typing indicator channel subscription
 * Subscribes to realtime typing events for a specific ticket
 * 
 * @param config.showTypingFrom - 'admin' to show admin typing, 'customer' to show customer typing
 */
export function useTypingIndicator(config: TypingIndicatorConfig): void {
  const { isOpen, ticketId, onTypingStart, onTypingStop, typingTimeoutRef, showTypingFrom } = config;

  useEffect(() => {
    if (!isOpen || !ticketId) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 Setting up typing channel for ticket:', ticketId, 'showTypingFrom:', showTypingFrom);
    }

    const typingChannel = supabase
      .channel(`typing-${ticketId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
        console.log('🎯 Typing event received:', payload);
        
        // Determine if we should show typing based on who sent it
        const shouldShowTyping = showTypingFrom === 'admin' 
          ? payload.isAdmin === true  // Show if admin is typing (for customer modal)
          : payload.isAdmin === false; // Show if customer is typing (for admin modal)
        
        if (payload.ticketId === ticketId && shouldShowTyping) {
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Show typing indicator
          onTypingStart();
          // Auto-hide after 3 seconds
          typingTimeoutRef.current = setTimeout(() => {
            onTypingStop();
          }, 3000);
        }
      })
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📡 Typing channel status:', status);
        }
      });

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 Unsubscribing from typing channel:', ticketId);
      }
      typingChannel.unsubscribe();
    };
  }, [isOpen, ticketId, onTypingStart, onTypingStop, typingTimeoutRef, showTypingFrom]);
}
