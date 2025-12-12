/**
 * useAdminBookings Hook
 * 
 * Manages bookings and calendar events for the Admin Modal:
 * - Fetches bookings from API
 * - Converts bookings to calendar events
 * - Handles booking count
 * - Manages realtime updates
 * 
 * @example
 * ```tsx
 * const {
 *   events,
 *   activeBookingCount,
 *   loadBookings,
 *   fetchActiveBookingCount
 * } = useAdminBookings(organizationId, currentDate);
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { CalendarEvent } from '../../shared/types';

export interface UseAdminBookingsReturn {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  loadBookings: () => Promise<void>;
  fetchActiveBookingCount: () => Promise<void>;
  activeBookingCount: number;
  setActiveBookingCount: (count: number) => void;
}

/**
 * Helper function to get status color
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return '#10b981'; // green
    case 'waiting': return '#f59e0b'; // amber
    case 'in_progress': return '#8b5cf6'; // purple
    case 'completed': return '#14b8a6'; // teal
    case 'cancelled': return '#ef4444'; // red
    // Legacy statuses (backward compatibility)
    case 'scheduled': return '#10b981'; // treat as confirmed
    case 'pending': return '#f59e0b'; // treat as waiting
    case 'no_show': return '#6b7280'; // gray (legacy, treat as cancelled)
    default: return '#14b8a6'; // teal fallback
  }
};

/**
 * Custom hook to manage admin bookings
 */
export function useAdminBookings(
  organizationId: string | undefined,
  currentDate: Date,
  isOpen: boolean
): UseAdminBookingsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeBookingCount, setActiveBookingCount] = useState(0);

  // Fetch active booking count - standalone call
  const fetchActiveBookingCount = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/meetings/bookings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const activeBookings = (data.bookings || []).filter((b: any) => 
          !['cancelled', 'completed'].includes(b.status)
        );
        setActiveBookingCount(activeBookings.length);
      }
    } catch (err) {
      console.error('Error fetching booking count:', err);
    }
  }, [organizationId]);

  // Load bookings and convert to calendar events
  const loadBookings = useCallback(async () => {
    if (!isOpen || !organizationId) return;

    try {
      // Load existing bookings via API
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const bookingsResponse = await fetch(
        `/api/meetings/bookings?organization_id=${organizationId}&start_date=${format(startOfMonth, 'yyyy-MM-dd')}&end_date=${format(endOfMonth, 'yyyy-MM-dd')}`
      );

      if (!bookingsResponse.ok) {
        throw new Error('Failed to load bookings');
      }

      const bookingsData = await bookingsResponse.json();

      // Get bookings and calculate active count
      const bookings = bookingsData.bookings || [];
      const activeBookings = bookings.filter((b: any) => 
        !['cancelled', 'completed'].includes(b.status)
      );
      setActiveBookingCount(activeBookings.length);

      // Convert bookings to calendar events
      const calendarEvents: CalendarEvent[] = bookings.map((booking: any) => ({
        id: booking.id,
        title: booking.title,
        start: new Date(booking.scheduled_at),
        end: new Date(new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000),
        type: 'meeting',
        status: booking.status,
        description: booking.description || booking.notes,
        backgroundColor: getStatusColor(booking.status),
        extendedProps: {
          booking: {
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            meeting_type_id: booking.meeting_type_id,
            meeting_type_name: booking.meeting_type?.name,
            status: booking.status,
            notes: booking.notes,
            duration_minutes: booking.duration_minutes,
            scheduled_at: booking.scheduled_at,
            id: booking.id,
          },
        },
      }));

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error loading bookings:', err);
      throw err;
    }
  }, [organizationId, currentDate, isOpen]);

  return {
    events,
    setEvents,
    loadBookings,
    fetchActiveBookingCount,
    activeBookingCount,
    setActiveBookingCount,
  };
}
