import { supabase } from '@/lib/supabase';

/**
 * Broadcast typing event to other participants
 * 
 * Sends a realtime broadcast message to indicate the user is typing.
 * Other participants subscribed to the same ticket channel will receive
 * this event and can show a typing indicator.
 * 
 * @param ticketId - The ID of the ticket being typed in
 * @param isAdmin - Whether the typing user is an admin (true) or customer (false)
 * 
 * @example
 * // Customer typing
 * broadcastTyping(selectedTicket.id, false);
 * 
 * @example
 * // Admin typing
 * broadcastTyping(selectedTicket.id, true);
 */
export function broadcastTyping(ticketId: string, isAdmin: boolean): void {
  if (!ticketId) return;
  
  const channel = supabase.channel(`typing-${ticketId}`);
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      ticketId,
      isAdmin,
      timestamp: Date.now(),
    },
  });
}
