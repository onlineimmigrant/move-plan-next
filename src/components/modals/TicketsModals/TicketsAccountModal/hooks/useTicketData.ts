/**
 * useTicketData Hook
 * Manages ticket data fetching, loading states, and avatar management for customer modal
 */

import {
  useState,
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
  type MutableRefObject,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import { processTicketResponses } from '../../shared/utils';
import type { Ticket, Avatar } from '../../shared/types';

interface UseTicketDataProps {
  organizationId: string;
  ticketsPerPage: number;
  statuses: string[];
  isOpen: boolean;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface UseTicketDataReturn {
  tickets: Ticket[];
  setTickets: Dispatch<SetStateAction<Ticket[]>>;
  selectedTicket: Ticket | null;
  setSelectedTicket: Dispatch<SetStateAction<Ticket | null>>;
  selectedTicketRef: MutableRefObject<Ticket | null>;
  avatars: Avatar[];
  isLoadingTickets: boolean;
  loadingMore: boolean;
  hasMoreTickets: {[key: string]: boolean};
  fetchTickets: (loadMore?: boolean) => Promise<void>;
  loadMoreTickets: () => Promise<void>;
  fetchAvatars: () => Promise<void>;
  markMessagesAsRead: (ticketId: string) => Promise<void>;
}

export const useTicketData = ({
  organizationId,
  ticketsPerPage,
  statuses,
  isOpen,
  onToast,
}: UseTicketDataProps): UseTicketDataReturn => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreTickets, setHasMoreTickets] = useState<{[key: string]: boolean}>({});
  const selectedTicketRef = useRef<Ticket | null>(null);

  /**
   * Fetch tickets from database
   */
  const fetchTickets = useCallback(async (loadMore: boolean = false) => {
    if (!loadMore) {
      setIsLoadingTickets(true);
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onToast('User not authenticated', 'error');
        return;
      }

      const startIndex = loadMore ? tickets.length : 0;
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id, 
          subject, 
          status, 
          customer_id, 
          created_at, 
          message, 
          preferred_contact_method, 
          email, 
          full_name, 
          ticket_responses(
            id,
            ticket_id,
            user_id,
            message,
            is_admin,
            avatar_id,
            is_read,
            read_at,
            created_at,
            ticket_attachments(*)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'ticket_responses', ascending: true })
        .range(startIndex, startIndex + ticketsPerPage - 1);

      if (ticketsError) {
        onToast('Failed to load tickets', 'error');
        return;
      }

      // Process tickets to flatten attachments
      const processedTickets = (ticketsData || []).map(ticket => ({
        ...ticket,
        ticket_responses: processTicketResponses(ticket.ticket_responses)
      }));

      // Sort tickets by latest message timestamp (most recent first)
      const sortedTickets = processedTickets.sort((a, b) => {
        const getLatestTimestamp = (ticket: any) => {
          if (ticket.ticket_responses && ticket.ticket_responses.length > 0) {
            const lastResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
            return new Date(lastResponse.created_at).getTime();
          }
          return new Date(ticket.created_at).getTime();
        };
        
        return getLatestTimestamp(b) - getLatestTimestamp(a);
      });

      if (loadMore) {
        setTickets(prev => [...prev, ...sortedTickets]);
      } else {
        setTickets(sortedTickets);
      }

      // Check if there are more tickets for each status
      const hasMore: {[key: string]: boolean} = {};
      for (const status of statuses) {
        const statusTickets = ticketsData?.filter(t => t.status === status) || [];
        hasMore[status] = statusTickets.length === ticketsPerPage;
      }
      setHasMoreTickets(hasMore);
      
    } catch (error) {
      onToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [tickets.length, ticketsPerPage, organizationId, statuses, onToast]);

  /**
   * Load more tickets (pagination)
   */
  const loadMoreTickets = useCallback(async () => {
    setLoadingMore(true);
    await fetchTickets(true);
    setLoadingMore(false);
  }, [fetchTickets]);

  /**
   * Fetch avatars from database
   */
  const fetchAvatars = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_avatars')
        .select('id, title, full_name, image')
        .eq('organization_id', organizationId)
        .order('title', { ascending: true });

      if (error) {
        // Table doesn't exist - use default avatar only (this is expected)
        setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }]);
        return;
      }
      
      setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }, ...(data || [])]);
    } catch (err) {
      // Silently handle if table doesn't exist
      setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }]);
    }
  }, [organizationId]);

  /**
   * Mark all admin messages in a ticket as read by customer
   */
  const markMessagesAsRead = useCallback(async (ticketId: string) => {
    try {
      // Mark all admin messages in this ticket as read by the customer
      const { error } = await supabase
        .from('ticket_responses')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('ticket_id', ticketId)
        .eq('is_admin', true)
        .eq('is_read', false);

      if (error) {
        return;
      }

      // Update local state to reflect the read status
      setSelectedTicket((t) => {
        if (!t || t.id !== ticketId) return t;
        return {
          ...t,
          ticket_responses: t.ticket_responses.map(response => 
            response.is_admin && !response.is_read
              ? { ...response, is_read: true, read_at: new Date().toISOString() }
              : response
          )
        };
      });
      
      // Also update in the tickets list
      setTickets(prev => prev.map(ticket => {
        if (ticket.id !== ticketId) return ticket;
        return {
          ...ticket,
          ticket_responses: ticket.ticket_responses.map(response =>
            response.is_admin && !response.is_read
              ? { ...response, is_read: true, read_at: new Date().toISOString() }
              : response
          )
        };
      }));
    } catch (err) {
      // Silent fail
    }
  }, []);

  return {
    tickets,
    setTickets,
    selectedTicket,
    setSelectedTicket,
    selectedTicketRef,
    avatars,
    isLoadingTickets,
    loadingMore,
    hasMoreTickets,
    fetchTickets,
    loadMoreTickets,
    fetchAvatars,
    markMessagesAsRead,
  };
};
