import { useEffect, MutableRefObject } from 'react';
import { supabase } from '@/lib/supabase';

interface TypingIndicatorConfig {
  isOpen: boolean;
  ticketId: string | undefined;
  onTypingStart: () => void;
  onTypingStop: () => void;
  typingTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Custom hook to manage typing indicator channel subscription
 * Subscribes to realtime typing events for a specific ticket
 */
export function useTypingIndicator(config: TypingIndicatorConfig): void {
  const { isOpen, ticketId, onTypingStart, onTypingStop, typingTimeoutRef } = config;

  useEffect(() => {
    if (!isOpen || !ticketId) return;

    console.log('🔔 Setting up typing channel for ticket (Admin):', ticketId);

    const typingChannel = supabase
      .channel(`typing-${ticketId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
        console.log('🎯 Typing event received (Admin):', payload);
        if (payload.ticketId === ticketId && !payload.isAdmin) {
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
        console.log('📡 Typing channel status (Admin):', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from typing channel (Admin):', ticketId);
      typingChannel.unsubscribe();
    };
  }, [isOpen, ticketId, onTypingStart, onTypingStop, typingTimeoutRef]);
}
