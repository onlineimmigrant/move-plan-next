/**
 * useRealtimeSubscription Hook
 * Manages Supabase realtime subscriptions for ticket updates and response changes
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { processTicketResponses, scrollToBottom } from '../../shared/utils';
import type { Ticket } from '../../shared/types';

interface UseRealtimeSubscriptionProps {
  isOpen: boolean;
  selectedTicket: Ticket | null;
  selectedTicketRef: React.MutableRefObject<Ticket | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  setAttachmentUrls: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  fetchTickets: () => Promise<void>;
  loadAttachmentUrls: (responses: any[]) => Promise<void>;
}

export const useRealtimeSubscription = ({
  isOpen,
  selectedTicket,
  selectedTicketRef,
  messagesContainerRef,
  setSelectedTicket,
  setAttachmentUrls,
  fetchTickets,
  loadAttachmentUrls,
}: UseRealtimeSubscriptionProps) => {
  // Use a ref to always get the latest fetchTickets function
  const fetchTicketsRef = useRef(fetchTickets);
  
  // Update ref when fetchTickets changes
  useEffect(() => {
    fetchTicketsRef.current = fetchTickets;
  }, [fetchTickets]);

  /**
   * Refresh the currently selected ticket with latest data from database
   */
  const refreshSelectedTicket = useCallback(async () => {
    const currentTicket = selectedTicketRef.current;
    
    if (!currentTicket) {
      console.log('🔄 Realtime: No current ticket, skipping refresh');
      return;
    }
    
    console.log('🔄 Realtime: Starting refresh for ticket', currentTicket.id);
    
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, updated_at, assigned_to, message, preferred_contact_method, email, full_name')
        .eq('id', currentTicket.id)
        .single();
      
      if (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        throw ticketError;
      }
      
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
        console.error('Error fetching responses:', responsesError);
        throw responsesError;
      }
      
      // Process responses to flatten attachments
      const processedResponses = processTicketResponses(responsesData);
      
      console.log('🔄 Processed responses:', processedResponses.map(r => ({
        id: r.id,
        attachments: r.attachments?.length || 0
      })));
      // Create a completely new ticket object
      const updatedTicket = {
        ...ticketData,
        ticket_responses: [...processedResponses], // New array reference
        updated_at: new Date().toISOString(), // Ensure new object
      };
      
      // Update state - this should trigger re-render
      setSelectedTicket(updatedTicket);
      console.log('🔄 Realtime: setSelectedTicket called with', updatedTicket.ticket_responses.length, 'responses');
      
      // Load attachment URLs for any new images (don't await - run in background)
      if (updatedTicket.ticket_responses && updatedTicket.ticket_responses.length > 0) {
        console.log('📡 Realtime: Calling loadAttachmentUrls for', updatedTicket.ticket_responses.length, 'responses');
        loadAttachmentUrls(updatedTicket.ticket_responses);
      }
      
      // Force scroll after state update
      setTimeout(() => scrollToBottom(messagesContainerRef), 100);
    } catch (err) {
      console.error('Failed to refresh ticket:', err);
    }
  }, [selectedTicketRef, setSelectedTicket, setAttachmentUrls, messagesContainerRef]);

  // Setup subscription when modal opens
  useEffect(() => {
    let channel: any = null;
    
    const setup = async () => {
      if (!isOpen) return;
      
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Create a unique channel name to avoid conflicts
        const channelName = `customer-tickets-${user.id}-${Date.now()}`;
        
        channel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tickets',
              filter: `customer_id=eq.${user.id}`
            },
            () => {
              fetchTicketsRef.current();
              if (selectedTicketRef.current) {
                refreshSelectedTicket();
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ticket_responses'
              // No filter - listen to all responses and filter in callback
            },
            async (payload: any) => {
              console.log('📡 Realtime event received:', payload.eventType, 'table:', payload.table);
              
              // Only refresh if this response belongs to the current ticket
              if (selectedTicketRef.current && payload.new?.ticket_id === selectedTicketRef.current.id) {
                console.log('🔄 Realtime: Response change detected for ticket', payload.new?.ticket_id);
                console.log('🔄 Realtime: Response ID:', payload.new?.id, 'is_admin:', payload.new?.is_admin);
                console.log('🔄 Realtime: Event type:', payload.eventType, 'Old:', payload.old, 'New:', payload.new);

                // Get current user to check if this is our own NEW message creation
                const { data: { user } } = await supabase.auth.getUser();
                const isOwnNewMessage = payload.eventType === 'INSERT' && payload.new?.customer_id === user?.id && !payload.new?.is_admin;

                console.log('🔄 Realtime: Current user:', user?.id, 'Message customer_id:', payload.new?.customer_id, 'isOwnNewMessage:', isOwnNewMessage);

                if (!isOwnNewMessage) {
                  console.log('🔄 Realtime: Processing message change (external or update)');
                  fetchTicketsRef.current();
                  // Small delay to ensure database consistency
                  setTimeout(() => refreshSelectedTicket(), 100);
                } else {
                  console.log('🔄 Realtime: Skipping own new message creation to avoid race condition');
                }
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime connected for customer tickets');
            } else if (status !== 'CLOSED') {
              console.log('⚠️ Customer ticket subscription status:', status);
            }
          });
      } catch (err) {
        console.error('Failed to setup realtime subscription:', err);
      }
    };

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen, selectedTicket?.id]); // Re-run if modal opens/closes or ticket changes
};
