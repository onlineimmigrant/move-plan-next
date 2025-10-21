'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ArrowLeftIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Calendar, BookingForm } from '@/components/modals/MeetingsModals/shared/components';
import {
  MeetingsBookingModalProps,
  TimeSlot
} from '../shared/types';
import {
  useBookingState,
  useCalendarState,
  useMeetingTypes
} from '../shared/hooks';
import {
  CALENDAR_VIEWS,
  MODAL_VIEWS,
  UI_CONSTANTS,
  API_ENDPOINTS
} from '../shared/constants';
import { CustomerDataLoading, CalendarLoading } from '../shared/ui';
import { MeetingsErrorBoundary } from '../shared/ui';
import { useSettings } from '@/context/SettingsContext';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import { supabase } from '@/lib/supabase';

export default function MeetingsBookingModal({ isOpen, onClose, preselectedSlot }: MeetingsBookingModalProps) {
  const { settings } = useSettings();

  // View state
  const [currentView, setCurrentView] = useState<'calendar' | 'booking'>(MODAL_VIEWS.CALENDAR);
  const [error, setError] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);

  // Custom hooks for state management
  const bookingState = useBookingState();
  const calendarState = useCalendarState();
  const { meetingTypes, isLoading: loadingMeetingTypes, error: meetingTypesError } = useMeetingTypes(
    settings?.organization_id,
    false // isAdmin = false for customer modal
  );

  // Load customer email on mount
  useEffect(() => {
    if (isOpen) {
      loadCustomerEmail();
    }
  }, [isOpen]);

  const loadCustomerEmail = async () => {
    setLoadingCustomerData(true);
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        setLoadingCustomerData(false);
        return;
      }

      // Try to get email from profiles table first (more reliable)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      let email = profile?.email || user.email;
      let customerName = profile?.full_name || '';

      console.log('[Customer Modal] Profile data:', { 
        email, 
        customerName, 
        hasProfile: !!profile,
        fullNameInProfile: profile?.full_name 
      });

      if (!email) {
        console.error('No email found for customer');
        setLoadingCustomerData(false);
        return;
      }

      setCustomerEmail(email);
      
      // Pre-fill the email and name in booking form
      // If customerName exists in profile, always use it (overwrite any previous value)
      // This ensures the profile data is the source of truth
      bookingState.updateFormData({
        customer_email: email,
        customer_name: customerName || bookingState.formData.customer_name || ''
      });
    } catch (err) {
      console.error('Error loading customer email:', err);
    } finally {
      setLoadingCustomerData(false);
    }
  };


  // Load events when date or view changes
  useEffect(() => {
    if (isOpen && currentView === MODAL_VIEWS.CALENDAR) {
      loadEvents();
    }
  }, [isOpen, calendarState.currentDate, calendarState.calendarView, currentView]);

  // Load available slots when a slot is selected
  useEffect(() => {
    if (bookingState.selectedSlot) {
      loadAvailableSlots(bookingState.selectedSlot.start);
    }
  }, [bookingState.selectedSlot]);


  const loadEvents = async () => {
    if (!settings?.organization_id) {
      console.error('Organization ID not available');
      return;
    }

    calendarState.setIsLoading(true);
    try {
      // Get date range based on view
      let startDate: Date;
      let endDate: Date;

      switch (calendarState.calendarView) {
        case CALENDAR_VIEWS.MONTH:
          startDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth(), 1);
          endDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 0);
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

      const response = await fetch(
        `${API_ENDPOINTS.MEETINGS.BOOKINGS}?organization_id=${settings.organization_id}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`
      );

      if (response.ok) {
        const data = await response.json();
        // Filter bookings to show only this customer's bookings
        const customerBookings = customerEmail
          ? (data.bookings || []).filter((booking: any) => booking.customer_email === customerEmail)
          : [];

        // Convert bookings to calendar events
        const calendarEvents: any[] = customerBookings.map((booking: any) => ({
          id: booking.id,
          title: booking.title,
          start: new Date(booking.scheduled_at),
          end: new Date(new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000),
          backgroundColor: booking.meeting_type?.color || '#3B82F6',
          extendedProps: {
            booking,
            meetingType: booking.meeting_type,
          },
        }));
        calendarState.setEvents(calendarEvents);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError(UI_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      calendarState.setIsLoading(false);
    }
  };

  const loadAvailableSlots = async (date: Date) => {
    if (!settings?.organization_id) return;

    try {
      const now = new Date();

      // Format date as YYYY-MM-DD in LOCAL timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      console.log('[Customer Modal] Loading slots for date:', formattedDate, 'from Date object:', date.toLocaleString());

      // Fetch available slots from API (customers see business hours only)
      const response = await fetch(
        `${API_ENDPOINTS.MEETINGS.AVAILABILITY}?organization_id=${settings.organization_id}&date=${formattedDate}&is_admin=false`
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

      console.log(`[Customer Modal] Loaded ${slots.length} future slots for ${formattedDate}`);
      if (slots.length > 0) {
        console.log('[Customer Modal] First slot:', format(slots[0].start, 'yyyy-MM-dd HH:mm'));
        console.log('[Customer Modal] Last slot:', format(slots[slots.length - 1].start, 'yyyy-MM-dd HH:mm'));
      }

      bookingState.setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading available slots:', err);
      bookingState.setAvailableSlots([]);
    }
  };

  const handleSlotClick = async (date: Date, hour?: number) => {
    // Load available slots for the selected date
    loadAvailableSlots(date);

    // Only load customer email if we don't already have it
    if (!customerEmail || !bookingState.formData.customer_email) {
      // Set loading state BEFORE switching views
      setLoadingCustomerData(true);

      // Switch to booking view (will show loading indicator)
      setCurrentView(MODAL_VIEWS.BOOKING);

      // Load customer email (this will also manage loadingCustomerData state)
      await loadCustomerEmail();
    } else {
      // Customer data already loaded, just switch view
      setCurrentView(MODAL_VIEWS.BOOKING);
    }
  };

  const handleBookingSubmit = async (data: any) => {
    if (!settings?.organization_id) {
      setError('Organization context not available');
      return;
    }

    bookingState.setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.MEETINGS.BOOKINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organization_id: settings.organization_id,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Refresh events
        await loadEvents();

        // Reset form and go back to calendar
        setCurrentView(MODAL_VIEWS.CALENDAR);
        bookingState.resetForm({
          customer_email: bookingState.formData.customer_email,
          customer_name: bookingState.formData.customer_name,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || UI_CONSTANTS.ERROR_MESSAGES.VALIDATION_ERROR);
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(UI_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      bookingState.setIsSubmitting(false);
    }
  };

  const handleEventClick = (event: any) => {
    // TODO: Open booking details modal
    console.log('Event clicked:', event);
  };

  const handleBookingFormChange = useCallback((data: Partial<any>) => {
    bookingState.updateFormData(data);
  }, [bookingState]);

  const handleClose = () => {
    setCurrentView(MODAL_VIEWS.CALENDAR);
    bookingState.resetForm({
      customer_email: bookingState.formData.customer_email,
      customer_name: bookingState.formData.customer_name,
    });
    setError(null);
    onClose();
  };

  // Get modal title with icon
  const getModalTitle = () => {
    if (currentView === 'calendar') {
      return (
        <div className="flex items-center gap-2">
          <CalendarIcon className="hidden sm:inline w-6 h-6 text-blue-600" />
          <span>Meetings</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <UserGroupIcon className="hidden sm:inline w-6 h-6 text-blue-600" />
        <span>Meetings</span>
      </div>
    );
  };

  // Get subtitle
  const getSubtitle = () => {
    if (currentView === 'calendar') {
      return 'Calendar';
    }
    return 'Booking';
  };

  // Header actions for booking view
  const handleBackToCalendar = () => {
    // Keep customer email and name when going back
    const customerData = {
      customer_email: bookingState.formData.customer_email,
      customer_name: bookingState.formData.customer_name,
    };
    bookingState.resetForm(customerData);
    setCurrentView(MODAL_VIEWS.CALENDAR);
  };

  const headerActions = currentView === MODAL_VIEWS.BOOKING ? (
    <button
      onClick={handleBackToCalendar}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Calendar
    </button>
  ) : null;

  return (
    <MeetingsErrorBoundary>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title={getModalTitle()}
        subtitle={getSubtitle()}
        size="xl"
        draggable={true}
        resizable={true}
        showCloseButton={true}
        showFullscreenButton={false}
        headerActions={headerActions}
        noPadding={false}
        scrollable={true}
        closeOnBackdropClick={true}
        closeOnEscape={true}
        className="meetings-booking-modal"
      >
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {calendarState.isLoading ? (
          <CalendarLoading />
        ) : currentView === MODAL_VIEWS.CALENDAR ? (
          meetingTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-gray-500 mb-4">
                <CalendarIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Meeting Types Available</h3>
              <p className="text-gray-500">Please check your organization settings or contact support.</p>
            </div>
          ) : (
            <Calendar
              events={calendarState.events}
              currentDate={calendarState.currentDate}
              view={calendarState.calendarView}
              onDateChange={calendarState.setCurrentDate}
              onViewChange={calendarState.setCalendarView}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              loading={false}
            />
          )
        ) : loadingCustomerData ? (
          <CustomerDataLoading />
        ) : (
          <BookingForm
            formData={bookingState.formData}
            availableSlots={bookingState.availableSlots}
            meetingTypes={meetingTypes}
            onChange={handleBookingFormChange}
            onSubmit={handleBookingSubmit}
            onCancel={handleBackToCalendar}
            isSubmitting={bookingState.isSubmitting}
            errors={bookingState.errors}
            readOnlyEmail={true}
          />
        )}
      </BaseModal>
    </MeetingsErrorBoundary>
  );
}