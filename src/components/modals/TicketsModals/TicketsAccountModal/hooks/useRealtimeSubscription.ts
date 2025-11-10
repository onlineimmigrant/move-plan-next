/**
 * useRealtimeSubscription Hook
 * Manages Supabase realtime subscriptions for ticket updates and response changes
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { processTicketResponses, scrollToBottom, loadAttachmentUrls } from '../../shared/utils';
import type { Ticket } from '../../shared/types';

interface UseRealtimeSubscriptionProps {
  isOpen: boolean;
  selectedTicket: Ticket | null;
  selectedTicketRef: React.MutableRefObject<Ticket | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  setAttachmentUrls: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  fetchTickets: () => Promise<void>;
}

export const useRealtimeSubscription = ({
  isOpen,
  selectedTicket,
  selectedTicketRef,
  messagesContainerRef,
  setSelectedTicket,
  setAttachmentUrls,
  fetchTickets,
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
  const refreshSelectedTicket = async () => {
    const currentTicket = selectedTicketRef.current;
    
    if (!currentTicket) {
      return;
    }
    
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, updated_at, assigned_to, message, preferred_contact_method, email, full_name')
        .eq('id', currentTicket.id)
        .single();
      
      if (ticketError) {
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
        throw responsesError;
      }
      
      // Process responses to flatten attachments
      const processedResponses = processTicketResponses(responsesData);
      
      const updatedTicket = {
        ...ticketData,
        ticket_responses: processedResponses
      };
      
      setSelectedTicket(updatedTicket);
      
      // Load attachment URLs for any new images
      if (updatedTicket.ticket_responses && updatedTicket.ticket_responses.length > 0) {
        const urlsMap = await loadAttachmentUrls(updatedTicket.ticket_responses);
        setAttachmentUrls(prev => ({ ...prev, ...urlsMap }));
      }
      
      // Force scroll after state update
      setTimeout(() => scrollToBottom(messagesContainerRef), 100);
    } catch (err) {
      // Silent fail - realtime refresh errors shouldn't break the UI
    }
  };

  /**
   * Setup realtime subscription for ticket and response updates
   */
  const setupRealtimeSubscription = async () => {
    try {
      // Get current user for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Fetch user's tickets to get ticket IDs for response filtering
      const { data: userTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id')
        .eq('customer_id', user.id);

      if (ticketsError) {
        return;
      }

      const ticketIds = userTickets?.map(t => t.id).join(',') || 'null';

      const channel = supabase
        .channel('customer-tickets-channel', {
          config: {
            broadcast: { self: true },
            presence: { key: selectedTicket?.id || 'none' },
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
            refreshSelectedTicket();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket_responses',
            filter: `ticket_id=in.(${ticketIds})`
          },
          () => {
            // Add small delay to ensure attachments are saved before fetching
            setTimeout(() => {
              fetchTicketsRef.current();
              refreshSelectedTicket();
            }, 500); // 500ms delay to ensure attachments are committed
          }
        )
        .subscribe();
    } catch (err) {
      // Silent fail - realtime subscription errors shouldn't break the UI
    }
  };

  // Setup subscription when modal opens
  useEffect(() => {
    if (isOpen) {
      setupRealtimeSubscription();
    }

    return () => {
      supabase.channel('customer-tickets-channel').unsubscribe();
    };
  }, [isOpen]);
};
