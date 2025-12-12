import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { TimeSlot } from '../../shared/types';
import { API_ENDPOINTS, CALENDAR_VIEWS } from '../../shared/constants';
import { logError } from '../../shared/utils/errorHandling';

interface CalendarState {
  currentDate: Date;
  calendarView: string;
  setEvents: (events: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

interface BookingState {
  formData: any;
  updateFormData: (data: any) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  setIsLoadingSlots: (loading: boolean) => void;
}

interface UseCustomerBookingDataParams {
  organizationId?: string;
  bookingState: BookingState;
  calendarState: CalendarState;
  onError?: (message: string) => void;
}

export interface UseCustomerBookingDataReturn {
  customerEmail: string | null;
  loadingCustomerData: boolean;
  loadCustomerEmail: () => Promise<void>;
  loadEvents: (showLoading?: boolean) => Promise<void>;
  loadAvailableSlots: (date: Date, showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook to manage customer booking data loading
 * Extracts data loading logic from MeetingsBookingModal
 */
export function useCustomerBookingData({
  organizationId,
  bookingState,
  calendarState,
  onError,
}: UseCustomerBookingDataParams): UseCustomerBookingDataReturn {
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);

  /**
   * Load customer email from authenticated user profile
   * Pre-fills email and name in booking form
   */
  const loadCustomerEmail = useCallback(async () => {
    setLoadingCustomerData(true);
    try {
      // Get authenticated user (optional for public booking pages)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No authenticated user - allow guest booking (for public appointment pages)
        setLoadingCustomerData(false);
        return;
      }

      // Try to get email from profiles table first (more reliable)
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      const email = profile?.email || user.email;
      const customerName = profile?.full_name || '';

      if (!email) {
        setLoadingCustomerData(false);
        return;
      }

      setCustomerEmail(email);
      
      // Pre-fill the email and name in booking form
      // If customerName exists in profile, always use it (overwrite any previous value)
      // This ensures the profile data is the source of truth
      bookingState.updateFormData({
        customer_email: email,
        customer_name: customerName || bookingState.formData.customer_name || '',
      });
    } catch (err) {
      logError(err, { context: 'Error loading customer email' });
    } finally {
      setLoadingCustomerData(false);
    }
  }, [bookingState]);

  /**
   * Load calendar events for the current view
   * Filters to show only customer's bookings (or no bookings for guests)
   * @param showLoading - Whether to show loading skeleton (default: true, false for initial load)
   */
  const loadEvents = useCallback(async (showLoading = true) => {
    if (!organizationId) {
      logError(new Error('Organization ID not available'), { context: 'loadEvents' });
      calendarState.setIsLoading(false);
      return;
    }

    if (showLoading) {
      calendarState.setIsLoading(true);
    }
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no authenticated user, show no bookings (only available slots will be shown)
      if (!user) {
        calendarState.setEvents([]);
        calendarState.setIsLoading(false);
        return;
      }

      // Get customer email for filtering
      const userEmail = customerEmail || user.email;
      
      // If still no email, show no bookings
      if (!userEmail) {
        calendarState.setEvents([]);
        calendarState.setIsLoading(false);
        return;
      }

      // Get date range based on view
      let startDate: Date;
      let endDate: Date;

      switch (calendarState.calendarView) {
        case CALENDAR_VIEWS.MONTH:
          startDate = new Date(
            calendarState.currentDate.getFullYear(),
            calendarState.currentDate.getMonth(),
            1
          );
          endDate = new Date(
            calendarState.currentDate.getFullYear(),
            calendarState.currentDate.getMonth() + 1,
            0
          );
          break;
        case CALENDAR_VIEWS.WEEK:
          const weekStart = new Date(calendarState.currentDate);
          weekStart.setDate(calendarState.currentDate.getDate() - calendarState.currentDate.getDay());
          startDate = weekStart;
          endDate = new Date(weekStart);
          endDate.setDate(weekStart.getDate() + 6);
          break;
        case CALENDAR_VIEWS.DAY:
          startDate = calendarState.currentDate;
          endDate = calendarState.currentDate;
          break;
        default:
          startDate = calendarState.currentDate;
          endDate = calendarState.currentDate;
      }

      // Fetch bookings filtered by customer email (only show customer's own bookings)
      const response = await fetch(
        `${API_ENDPOINTS.MEETINGS.BOOKINGS}?organization_id=${organizationId}&customer_email=${encodeURIComponent(userEmail)}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`
      );

      if (response.ok) {
        const data = await response.json();
        
        // For booking modal calendar view: show only customer's own bookings
        // Unregistered users will see no bookings (empty array above)
        const customerBookings = data.bookings || [];

        // Helper function to get status color
        const getStatusColor = (status: string): string => {
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
        };

        // Convert bookings to calendar events
        const calendarEvents: any[] = customerBookings.map((booking: any) => ({
          id: booking.id,
          title: booking.title,
          start: new Date(booking.scheduled_at),
          end: new Date(
            new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000
          ),
          backgroundColor: getStatusColor(booking.status),
          extendedProps: {
            booking,
            meetingType: booking.meeting_type,
          },
        }));
        calendarState.setEvents(calendarEvents);
      }
    } catch (err) {
      logError(err, { context: 'Error loading events' });
      if (onError) {
        onError('Failed to load calendar events. Please try again.');
      }
    } finally {
      calendarState.setIsLoading(false);
    }
    // Intentionally NOT including currentDate/calendarView to prevent infinite loops
    // The parent component handles reloading when those change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, customerEmail]);

  /**
   * Load available time slots for a specific date
   * Filters out past time slots
   * @param date - The date to load slots for
   * @param showLoading - Whether to show loading skeleton
   */
  const loadAvailableSlots = useCallback(
    async (date: Date, showLoading = false) => {
      if (!organizationId) return;

      try {
        if (showLoading) {
          bookingState.setIsLoadingSlots(true);
        }
        const now = new Date();

        // Format date as YYYY-MM-DD in LOCAL timezone (not UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Fetch available slots from API (customers see business hours only)
        const response = await fetch(
          `${API_ENDPOINTS.MEETINGS.AVAILABILITY}?organization_id=${organizationId}&date=${formattedDate}&is_admin=false`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch available slots');
        }

        const data = await response.json();

        // Convert ISO string dates back to Date objects and filter past times
        const slots: TimeSlot[] = data.slots
          .map((slot: { start: string; end: string; available: boolean }) => ({
            start: new Date(slot.start),
            end: new Date(slot.end),
            available: slot.available,
          }))
          .filter((slot: TimeSlot) => {
            // Filter out past time slots (use getTime() for accurate comparison)
            return slot.start.getTime() >= now.getTime();
          });

        bookingState.setAvailableSlots(slots);
      } catch (err) {
        logError(err, { context: 'Error loading available slots' });
        bookingState.setAvailableSlots([]);
      } finally {
        bookingState.setIsLoadingSlots(false);
      }
    },
    [organizationId, bookingState]
  );

  return {
    customerEmail,
    loadingCustomerData,
    loadCustomerEmail,
    loadEvents,
    loadAvailableSlots,
  };
}
