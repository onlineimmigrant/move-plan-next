/**
 * useUnreadMeetingsCount Hook
 * 
 * Fetches and manages the count of unviewed meetings for the current user.
 * A meeting is considered "unviewed" if the current user's ID is not in the viewed_by array.
 * 
 * Updates in real-time via Supabase subscriptions.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { BADGE_REFRESH_EVENT } from './useBadgeRefresh';

export function useUnreadMeetingsCount() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { session, isAdmin, isSuperadmin } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    // Skip fetching if admin is on /account page (admins don't have customer meetings)
    const isAdminUser = isAdmin || isSuperadmin;
    if (isAdminUser && pathname?.startsWith('/account')) {
      setUnreadCount(0);
      return;
    }

    try {
      const userId = session.user.id;

      console.log('🎬 [useUnreadMeetingsCount] Fetching count for:', {
        userId,
        isAdmin: isAdminUser,
        orgId: settings.organization_id
      });

      if (isAdminUser) {
        // Admin: Count all org meetings where admin's ID is not in viewed_by array
        const { data, count, error } = await supabase
          .from('bookings')
          .select('id, viewed_by, customer_name', { count: 'exact' })
          .eq('organization_id', settings.organization_id)
          .not('viewed_by', 'cs', `["${userId}"]`); // cs = contains (PostgreSQL JSONB operator)

        if (error) {
          console.error('❌ Error fetching admin unviewed meetings:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setUnreadCount(0);
          return;
        }

        console.log('✅ Admin unviewed meetings:', { count, sample: data?.slice(0, 3) });
        setUnreadCount(count || 0);
      } else {
        // Customer: Count meetings where customer_email matches user's email
        // and their ID is not in viewed_by array
        // NOTE: customer_id is always NULL in bookings table, only customer_email is used
        
        console.log('🔍 Building customer query with:', {
          email: session.user.email,
          userId: userId,
          userMetadata: session.user.user_metadata,
          userEmail: session.user.email
        });

        // First, let's check ALL meetings for this email (without viewed_by filter)
        const { data: allMeetings, count: totalCount } = await supabase
          .from('bookings')
          .select('id, viewed_by, customer_name, customer_email', { count: 'exact' })
          .eq('customer_email', session.user.email);

        console.log('📊 ALL meetings for this email:', {
          totalCount,
          email: session.user.email,
          allMeetings: allMeetings?.slice(0, 3)
        });

        // Now with the viewed_by filter
        const { data, count, error } = await supabase
          .from('bookings')
          .select('id, viewed_by, customer_name, customer_email', { count: 'exact' })
          .eq('customer_email', session.user.email)
          .not('viewed_by', 'cs', `["${userId}"]`);

        if (error) {
          console.error('❌ Error fetching customer unviewed meetings:', error);
          setUnreadCount(0);
          return;
        }

        console.log('✅ Customer unviewed meetings:', { 
          count, 
          email: session.user.email,
          userId: userId,
          sample: data?.slice(0, 3),
          viewedByFilter: `NOT contains ["${userId}"]`
        });
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('❌ Error in fetchUnreadCount:', err);
    }
  }, [session, isAdmin, isSuperadmin, settings.organization_id, pathname]);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds for new meetings
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    // Listen for manual refresh events
    const handleManualRefresh = () => {
      fetchUnreadCount();
    };
    window.addEventListener(BADGE_REFRESH_EVENT, handleManualRefresh);

    // Subscribe to bookings changes with same pattern as tickets
    const userId = session.user.id;
    const channelName = `unread-meetings-badge-${userId}-${Date.now()}`;
    
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
          table: 'bookings',
        },
        (payload) => {
          console.log('🔔 [useUnreadMeetingsCount] Booking changed:', {
            event: payload.eventType,
            bookingId: (payload.new as any)?.id || (payload.old as any)?.id,
            viewed_by: (payload.new as any)?.viewed_by || (payload.old as any)?.viewed_by
          });
          // Refetch count when any booking changes
          fetchUnreadCount();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [useUnreadMeetingsCount] Realtime connected, channel:', channelName);
        } else if (status !== 'CLOSED') {
          console.log('⚠️ [useUnreadMeetingsCount] Subscription status:', status);
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
