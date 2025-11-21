/**
 * useUnreadTicketCount Hook
 * 
 * Fetches and manages the count of unread ticket messages for the current user.
 * - For customers: counts unread admin replies on their tickets
 * - For admins: counts unread customer messages on all tickets in their org
 * 
 * Updates in real-time via Supabase subscriptions.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { BADGE_REFRESH_EVENT } from './useBadgeRefresh';

export function useUnreadTicketCount() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { session, isAdmin, isSuperadmin } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    // Skip fetching if admin is on /account page (admins don't have customer tickets)
    const isAdminUser = isAdmin || isSuperadmin;
    if (isAdminUser && pathname?.startsWith('/account')) {
      setUnreadCount(0);
      return;
    }

    try {
      const userId = session.user.id;

      if (isAdminUser) {
        // Admin: Count unread customer messages across all org tickets
        // First get all ticket IDs for this org
        const { data: orgTickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('id')
          .eq('organization_id', settings.organization_id);

        if (ticketsError) {
          console.error('Error fetching org tickets:', {
            message: ticketsError.message,
            details: ticketsError.details,
            hint: ticketsError.hint,
            code: ticketsError.code
          });
          setUnreadCount(0);
          return;
        }

        const ticketIds = orgTickets?.map(t => t.id) || [];

        if (ticketIds.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Then count unread customer messages on those tickets
        const { data: responses, error } = await supabase
          .from('ticket_responses')
          .select('id, ticket_id, is_read, is_admin')
          .eq('is_admin', false) // Customer messages
          .eq('is_read', false) // Not yet read
          .in('ticket_id', ticketIds);

        if (error) {
          console.error('Error fetching admin unread count:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setUnreadCount(0);
          return;
        }

        setUnreadCount(responses?.length || 0);
      } else {
        // Customer: Count unread admin replies on their tickets
        // First get customer's ticket IDs
        const { data: customerTickets } = await supabase
          .from('tickets')
          .select('id')
          .eq('customer_id', userId);

        const ticketIds = customerTickets?.map(t => t.id) || [];

        if (ticketIds.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Then count unread admin responses
        const { count, error } = await supabase
          .from('ticket_responses')
          .select('*', { count: 'exact', head: true })
          .eq('is_admin', true)
          .eq('is_read', false)
          .in('ticket_id', ticketIds);

        if (error) {
          console.error('Error fetching customer unread count:', error);
          setUnreadCount(0);
          return;
        }

        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('Error in fetchUnreadCount:', err);
    }
  }, [session, isAdmin, isSuperadmin, settings.organization_id, pathname]);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds for new messages
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    // Listen for manual refresh events
    const handleManualRefresh = () => {
      fetchUnreadCount();
    };
    window.addEventListener(BADGE_REFRESH_EVENT, handleManualRefresh);

    // Subscribe to ticket_responses changes with same pattern as TicketsAccountModal
    const userId = session.user.id;
    const channelName = `unread-badge-${userId}-${Date.now()}`;
    
    const channel = supabase
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
          table: 'ticket_responses',
        },
        (payload) => {
          console.log('🔔 Badge: Ticket response changed:', payload.eventType);
          // Refetch count when any ticket response changes
          fetchUnreadCount();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Badge realtime connected');
        } else if (status !== 'CLOSED' && status !== 'CHANNEL_ERROR') {
          console.log('⚠️ Badge subscription status:', status);
        }
      });

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener(BADGE_REFRESH_EVENT, handleManualRefresh);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session, fetchUnreadCount]);

  return unreadCount;
}