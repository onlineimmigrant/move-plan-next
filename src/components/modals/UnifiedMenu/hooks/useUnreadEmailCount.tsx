'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook to fetch unread email count for the current user's organization
 * Used for badge display in UnifiedMenu Email item
 */
export function useUnreadEmailCount(isAuthenticated: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userData.user.id)
          .single();

        if (!profile) return;

        // Count unread threads for this organization
        const { count: unreadCount, error } = await supabase
          .from('email_threads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .eq('is_read', false)
          .eq('is_archived', false);

        if (!error && unreadCount !== null) {
          setCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread email count:', error);
        setCount(0);
      }
    };

    fetchUnreadCount();

    // Set up realtime subscription for email_threads
    const channel = supabase
      .channel('email_threads_unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_threads',
          filter: `is_read=eq.false`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  return count;
}
