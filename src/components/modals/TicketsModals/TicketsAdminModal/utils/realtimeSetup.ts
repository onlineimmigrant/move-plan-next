'use client';

import { supabase } from '@/lib/supabase';
import type { Ticket } from '../types';
import { processTicketResponses } from './ticketHelpers';

interface RealtimeSetupParams {
  selectedTicket: Ticket | null;
  selectedTicketRef: React.RefObject<Ticket | null>;
  realtimeChannelRef: React.MutableRefObject<ReturnType<typeof supabase.channel> | null>;
  fetchTickets: () => void;
  refreshSelectedTicket: () => Promise<void>;
  fetchInternalNotes: (ticketId: string) => Promise<void>;
  fetchTicketsWithPinnedNotes: () => Promise<void>;
  fetchTicketNoteCounts: () => Promise<void>;
}

interface RefreshSelectedTicketParams {
  selectedTicketRef: React.RefObject<Ticket | null>;
  setSelectedTicket: (ticket: Ticket) => void;
  fetchTickets: () => void;
  loadAttachmentUrls: (responses: any[]) => Promise<void>;
  scrollToBottom: () => void;
}

export async function refreshSelectedTicket({
  selectedTicketRef,
  setSelectedTicket,
  fetchTickets,
  loadAttachmentUrls,
  scrollToBottom,
}: RefreshSelectedTicketParams) {
  const currentTicket = selectedTicketRef.current;

  if (!currentTicket) {
    console.log('⚠️ No selected ticket to refresh');
    return;
  }

  console.log('🔍 Starting refresh for ticket:', currentTicket.id);

  try {
    // Fetch the specific ticket with updated data
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', currentTicket.id)
      .single();
    
    if (ticketError) {
      console.error('❌ Error fetching ticket:', ticketError);
      throw ticketError;
    }
    
    console.log('✅ Ticket data fetched (admin)');
    
    // Fetch responses separately with proper ordering and attachments
    const { data: responsesData, error: responsesError } = await supabase
      .from('ticket_responses')
      .select(`
        *,
        ticket_attachments(*)
      `)
      .eq('ticket_id', currentTicket.id)
      .order('created_at', { ascending: true });
    
    if (responsesError) {
      console.error('❌ Error fetching responses:', responsesError);
      throw responsesError;
    }
    
    console.log('✅ Responses fetched (admin):', responsesData?.length);
    
    // Process responses to flatten attachments
    const processedResponses = processTicketResponses(responsesData || []);
    
    const updatedTicket = {
      ...ticketData,
      ticket_responses: processedResponses
    };
    
    console.log('🔄 Selected ticket refreshed (admin) - responses:', updatedTicket.ticket_responses.length, 'Previous:', currentTicket.ticket_responses?.length);
    setSelectedTicket(updatedTicket);
    
    // Also refresh the tickets list in background
    fetchTickets();
    
    // Load attachment URLs for any new images
    if (updatedTicket.ticket_responses && updatedTicket.ticket_responses.length > 0) {
      loadAttachmentUrls(updatedTicket.ticket_responses);
    }
    
    // Force scroll after state update
    setTimeout(() => scrollToBottom(), 100);
  } catch (err) {
    console.error('❌ Error refreshing selected ticket:', err);
  }
}

export function setupRealtimeSubscription({
  selectedTicket,
  selectedTicketRef,
  realtimeChannelRef,
  fetchTickets,
  refreshSelectedTicket: refreshTicketFn,
  fetchInternalNotes,
  fetchTicketsWithPinnedNotes,
  fetchTicketNoteCounts,
}: RealtimeSetupParams) {
  try {
    // Unsubscribe from any existing channel first
    if (realtimeChannelRef.current) {
      console.log('🔌 Cleaning up existing realtime channel (admin)');
      realtimeChannelRef.current.unsubscribe();
      realtimeChannelRef.current = null;
    }
    
    console.log('🔄 Setting up realtime subscription (admin)');
    
    // Create channel with direct inline subscription (like TicketsAccountModal)
    const channel = supabase
      .channel('admin_tickets', {
        config: {
          broadcast: { self: true },
          presence: { key: selectedTicket?.id || 'admin' },
        },
      })
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets'
        },
        (payload) => {
          console.log('✅ Realtime (Admin): Ticket change', payload);
          fetchTickets();
          refreshTicketFn();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_responses'
        },
        (payload) => {
          console.log('✅ Realtime (Admin): Response change', payload);
          console.log('📊 Payload details:', {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            new: payload.new,
            old: payload.old
          });
          fetchTickets();
          refreshTicketFn();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_notes'
        },
        (payload) => {
          console.log('✅ Realtime (Admin): Note change', payload);
          const currentTicket = selectedTicketRef.current;
          if (currentTicket) {
            fetchInternalNotes(currentTicket.id);
          }
          // Refresh the list of tickets with pinned notes and note counts
          fetchTicketsWithPinnedNotes();
          fetchTicketNoteCounts();
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status (Admin):', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates (Admin)');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error (Admin):', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Realtime subscription timed out (Admin)');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime channel closed (Admin)');
        }
      });
    
    // Store the channel reference for cleanup
    realtimeChannelRef.current = channel;
    console.log('✅ Realtime channel created and stored (admin)');
    
    return channel;
  } catch (err) {
    console.error('❌ Error setting up realtime subscription (Admin):', err);
  }
}

export function cleanupRealtimeSubscription(
  realtimeChannelRef: React.MutableRefObject<ReturnType<typeof supabase.channel> | null>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Unsubscribing from realtime (admin modal cleanup)');
  }
  if (realtimeChannelRef.current) {
    realtimeChannelRef.current.unsubscribe();
    realtimeChannelRef.current = null;
  }
}
