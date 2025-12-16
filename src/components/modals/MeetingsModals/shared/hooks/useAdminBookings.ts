/**
 * Custom hook for managing admin bookings data
 * Handles fetching and managing booking data for admin views
 * 
 * Features:
 * - Fetch active booking count
 * - Load bookings for date range
 * - Convert bookings to calendar events
 * - Status color mapping
 * - Error handling
 * 
 * @param organizationId - Organization ID
 * @returns Bookings state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   activeCount,
 *   bookings,
 *   events,
 *   loading,
 *   error,
 *   fetchActiveCount,
 *   loadBookings
 * } = useAdminBookings(organizationId);
 * ```
 */

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { CalendarEvent } from '@/types/meetings';
import { logError } from '../utils/errorHandling';

export interface AdminBooking {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  customer_email: string;
  customer_name: string;
  meeting_type?: any;
  [key: string]: any;
}

/**
 * Get color for booking status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return '#10b981'; // green
    case 'waiting':
      return '#f59e0b'; // amber
    case 'in_progress':
      return '#8b5cf6'; // purple
    case 'completed':
      return '#14b8a6'; // teal
    case 'cancelled':
      return '#ef4444'; // red
    // Legacy statuses (backward compatibility)
    case 'scheduled':
      return '#10b981'; // treat as confirmed
    case 'pending':
      return '#f59e0b'; // treat as waiting
    case 'no_show':
      return '#6b7280'; // gray (legacy, treat as cancelled)
    default:
      return '#14b8a6'; // teal fallback
  }
}

/**
 * Convert booking to calendar event
 */
function bookingToEvent(booking: AdminBooking): CalendarEvent {
  const start = new Date(booking.scheduled_at);
  const end = new Date(start.getTime() + booking.duration_minutes * 60000);

  return {
    id: booking.id,
    title: booking.title || 'Meeting',
    start,
    end,
    backgroundColor: getStatusColor(booking.status),
    extendedProps: {
      booking: booking as any, // Type assertion for compatibility
      meetingType: booking.meeting_type,
    },
  };
}

export function useAdminBookings(organizationId?: string) {
  const [activeCount, setActiveCount] = useState<number>(0);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch count of active bookings (not cancelled or completed)
   */
  const fetchActiveCount = useCallback(async () => {
    if (!organizationId) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/meetings/bookings`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const activeBookings = (data.bookings || []).filter(
          (b: AdminBooking) => !['cancelled', 'completed'].includes(b.status)
        );
        setActiveCount(activeBookings.length);
      }
    } catch (err) {
      logError(err, { context: 'Fetching active booking count' });
    }
  }, [organizationId]);

  /**
   * Load bookings for a specific date range
   */
  const loadBookings = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!organizationId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/meetings/bookings?organization_id=${organizationId}&start_date=${format(
            startDate,
            'yyyy-MM-dd'
          )}&end_date=${format(endDate, 'yyyy-MM-dd')}`
        );

        if (!response.ok) {
          throw new Error('Failed to load bookings');
        }

        const data = await response.json();
        const bookingsData = data.bookings || [];

        setBookings(bookingsData);

        // Convert to calendar events
        const calendarEvents = bookingsData.map(bookingToEvent);
        setEvents(calendarEvents);
      } catch (err) {
        const errorMessage = 'Failed to load bookings';
        setError(errorMessage);
        logError(err, { context: 'Loading admin bookings', organizationId });
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  /**
   * Refresh booking count
   */
  const refreshCount = useCallback(() => {
    return fetchActiveCount();
  }, [fetchActiveCount]);

  return {
    activeCount,
    bookings,
    events,
    loading,
    error,
    fetchActiveCount,
    loadBookings,
    refreshCount,
  };
}
