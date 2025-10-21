'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import { CalendarIcon, UserGroupIcon, ArrowLeftIcon, Cog6ToothIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { Calendar, BookingForm } from '@/components/modals/MeetingsModals/shared/components';
import { CalendarEvent, CalendarView, BookingFormData, MeetingType, TimeSlot } from '../shared/types';
import MeetingsSettingsModal from '../MeetingsSettingsModal';
import MeetingTypesModal from '../MeetingTypesModal';
import { EventDetailsModal } from '../EventDetailsModal';

interface MeetingsAdminModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Optional initial date to display
   */
  initialDate?: Date;

  /**
   * Optional callback when a meeting is successfully booked
   */
  onBookingSuccess?: (meetingId: string) => void;
}

/**
 * MeetingsAdminModal
 * 
 * Administrative modal for managing meetings with full control.
 * Allows admins to:
 * - Select any meeting type
 * - Choose any time slot
 * - Specify custom email addresses
 * - Override booking restrictions
 * 
 * Features:
 * - Calendar view for slot selection
 * - Booking form with full controls
 * - Real-time availability checking
 * - Drag & resize support
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <MeetingsAdminModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onBookingSuccess={(id) => console.log('Booked:', id)}
 * />
 * ```
 */
export default function MeetingsAdminModal({
  isOpen,
  onClose,
  initialDate,
  onBookingSuccess,
}: MeetingsAdminModalProps) {
  const { settings } = useSettings();

  // View state
  const [currentView, setCurrentView] = useState<'calendar' | 'booking'>('calendar');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loadingEventDetails, setLoadingEventDetails] = useState(false);
  const [use24Hour, setUse24Hour] = useState<boolean>(true);
  const [meetingSettings, setMeetingSettings] = useState<{
    business_hours_start?: string;
    business_hours_end?: string;
    is_24_hours?: boolean;
  }>({});

  // Calendar state
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Data state
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Form state
  const [bookingFormData, setBookingFormData] = useState<Partial<BookingFormData>>({});

  // Load meeting types and events
  const loadData = useCallback(async () => {
    if (!isOpen || !settings?.organization_id) return;

    try {
      setLoading(true);
      setError(null);

      // Load meeting types via new API (shows all types for admin, only active ones)
      const typesResponse = await fetch(`/api/meetings/types?organization_id=${settings.organization_id}`);
      if (!typesResponse.ok) {
        throw new Error('Failed to load meeting types');
      }
      const typesData = await typesResponse.json();
      // For admin view, show all active meeting types
      const activeMeetingTypes = (typesData.meeting_types || []).filter((mt: MeetingType) => mt.is_active);
      setMeetingTypes(activeMeetingTypes);

      // Load existing bookings via API
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const bookingsResponse = await fetch(
        `/api/meetings/bookings?organization_id=${settings.organization_id}&start_date=${format(startOfMonth, 'yyyy-MM-dd')}&end_date=${format(endOfMonth, 'yyyy-MM-dd')}`
      );

      if (!bookingsResponse.ok) {
        throw new Error('Failed to load bookings');
      }

      const bookingsData = await bookingsResponse.json();

      // Convert bookings to calendar events
      const calendarEvents: CalendarEvent[] = (bookingsData.bookings || []).map((booking: any) => ({
        id: booking.id,
        title: booking.title,
        start: new Date(booking.scheduled_at),
        end: new Date(new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000),
        type: 'meeting',
        status: booking.status,
        description: booking.description || booking.notes,
        backgroundColor: booking.meeting_type?.color || '#14B8A6',
        extendedProps: {
          booking: {
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            meeting_type_id: booking.meeting_type_id,
            meeting_type_name: booking.meeting_type?.name,
            meeting_type_color: booking.meeting_type?.color,
          },
        },
      }));

      setEvents(calendarEvents);

      // Load meeting settings (including is_24_hours preference)
      const settingsResponse = await fetch(`/api/meetings/settings?organization_id=${settings.organization_id}`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setMeetingSettings({
          business_hours_start: settingsData.business_hours_start,
          business_hours_end: settingsData.business_hours_end,
          is_24_hours: settingsData.is_24_hours ?? true,
        });
        setUse24Hour(settingsData.is_24_hours ?? true);
      }
    } catch (err) {
      console.error('Error loading meeting data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  }, [isOpen, settings?.organization_id, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for meeting types changes (when user edits them in settings)
  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };
    
    window.addEventListener('refreshMeetingTypes', handleRefresh);
    return () => window.removeEventListener('refreshMeetingTypes', handleRefresh);
  }, [loadData]);

  // Load available slots when needed
  const loadAvailableSlots = async (date: Date) => {
    if (!settings?.organization_id) return;

    try {
      setLoading(true);
      const now = new Date();
      
      // Format date as YYYY-MM-DD in LOCAL timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('[Admin Modal] Loading slots for date:', formattedDate, 'from Date object:', date.toLocaleString());
      
      // Fetch available slots from API (admins get 24-hour access if enabled)
      const response = await fetch(
        `/api/meetings/available-slots?organization_id=${settings.organization_id}&date=${formattedDate}&is_admin=true`,
        {
          // Add caching headers for better performance
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 1 minute
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      
      // Convert ISO string dates back to Date objects and filter past times
      const slots: TimeSlot[] = data.slots
        .map((slot: { 
          start: string; 
          end: string; 
          available: boolean;
          // API might return snake_case or camelCase
          is_business_hours?: boolean;
          isBusinessHours?: boolean;
        }) => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
          available: slot.available,
          isBusinessHours: slot.isBusinessHours ?? slot.is_business_hours ?? false,
        }))
        .filter((slot: TimeSlot) => {
          // Filter out past time slots (use getTime() for accurate comparison)
          return slot.start.getTime() >= now.getTime();
        });

      console.log(`[Admin Modal] Loaded ${slots.length} future slots for ${formattedDate}`);
      if (slots.length > 0) {
        console.log('[Admin Modal] First slot:', format(slots[0].start, 'yyyy-MM-dd HH:mm'));
        console.log('[Admin Modal] Last slot:', format(slots[slots.length - 1].start, 'yyyy-MM-dd HH:mm'));
      }
      
      setAvailableSlots(slots);
      
      // Log settings info for debugging
      if (data.settings?.is_admin_mode) {
        console.log('✨ 24-hour admin scheduling enabled:', data.settings);
      }
    } catch (err) {
      console.error('Error loading available slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle slot click (admin can select any slot)
  const handleSlotClick = useCallback((date: Date, hour?: number) => {
    // Load available slots for the selected date
    loadAvailableSlots(date);
    // Switch to booking view
    setCurrentView('booking');
  }, []);

  // Handle event click
  const handleEventClick = useCallback(async (event: CalendarEvent) => {
    if (!settings?.organization_id) return;
    
    try {
      setLoadingEventDetails(true);
      
      // Fetch full booking details
      const response = await fetch(
        `/api/meetings/bookings/${event.id}?organization_id=${settings.organization_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load event details');
      }
      
      const data = await response.json();
      const bookingData = data.booking || data; // Handle both { booking } and direct response
      
      // Map to EventDetails format
      const eventDetails = {
        id: bookingData.id,
        title: bookingData.title,
        scheduled_at: bookingData.scheduled_at,
        duration_minutes: bookingData.duration_minutes,
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        notes: bookingData.notes || bookingData.description,
        status: bookingData.status,
        meeting_type: bookingData.meeting_type ? {
          id: bookingData.meeting_type.id,
          name: bookingData.meeting_type.name || 'Meeting',
          color: bookingData.meeting_type.color,
          duration_minutes: bookingData.meeting_type.duration_minutes || bookingData.duration_minutes,
        } : undefined,
        created_at: bookingData.created_at,
        updated_at: bookingData.updated_at,
      };
      
      setSelectedEvent(eventDetails);
      setShowEventDetailsModal(true);
    } catch (err) {
      console.error('Error loading event details:', err);
      setError('Failed to load event details');
    } finally {
      setLoadingEventDetails(false);
    }
  }, [settings?.organization_id]);

  // Handle form changes
  const handleBookingFormChange = useCallback((data: Partial<BookingFormData>) => {
    setBookingFormData(prev => ({ ...prev, ...data }));
  }, []);

  // Handle booking submission
  const handleBookingSubmit = useCallback(async (data: BookingFormData) => {
    if (!settings?.organization_id) {
      setError('Organization context not available');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create booking via API
      const response = await fetch('/api/meetings/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organization_id: settings.organization_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const responseData = await response.json();

      // Success
      if (onBookingSuccess && responseData.booking) {
        onBookingSuccess(responseData.booking.id);
      }

      // Reload data
      await loadData();

      // Reset and close
      setBookingFormData({});
      setAvailableSlots([]);
      setCurrentView('calendar');
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }, [
    settings?.organization_id,
    onBookingSuccess,
    loadData,
    onClose,
  ]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setCurrentView('calendar');
    setBookingFormData({});
    setAvailableSlots([]);
    setError(null);
    onClose();
  }, [onClose]);

  // Get modal title with icon
  const getModalTitle = () => {
    if (currentView === 'calendar') {
      return (
        <div className="flex items-center gap-2">
          <CalendarIcon className="hidden sm:inline w-6 h-6 text-blue-600" />
          <span>Meetings</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Admin
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <UserGroupIcon className="hidden sm:inline w-6 h-6 text-blue-600" />
        <span>Meetings</span>
        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          Admin
        </span>
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
  const headerActions = currentView === 'booking' ? (
    <button
      onClick={() => setCurrentView('calendar')}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Calendar
    </button>
  ) : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowTypesModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
        title="Manage meeting types"
      >
        <ClockIcon className="w-4 h-4" />
        Types
      </button>
      <button
        onClick={() => setShowSettingsModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors"
        title="Configure meeting settings (including 24-hour format preference)"
      >
        <Cog6ToothIcon className="w-4 h-4" />
        Settings
      </button>
    </div>
  );

  return (
    <>
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
      className="meetings-admin-modal"
    >
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : currentView === 'calendar' ? (
        meetingTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-gray-500 mb-4">
              <CalendarIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Meeting Types Available</h3>
            <p className="text-gray-500">Please create meeting types in organization settings first.</p>
          </div>
        ) : (
          <Calendar
            events={events}
            currentDate={currentDate}
            view={calendarView}
            onDateChange={setCurrentDate}
            onViewChange={setCalendarView}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            loading={false}
            use24Hour={use24Hour}
          />
        )
      ) : (
        <BookingForm
          formData={bookingFormData}
          availableSlots={availableSlots}
          meetingTypes={meetingTypes}
          onChange={handleBookingFormChange}
          onSubmit={handleBookingSubmit}
          onCancel={() => setCurrentView('calendar')}
          isSubmitting={submitting}
          errors={{}}
          isAdmin={true}
          timeFormat24={use24Hour}
          businessHours={meetingSettings.business_hours_start && meetingSettings.business_hours_end ? {
            start: meetingSettings.business_hours_start,
            end: meetingSettings.business_hours_end
          } : undefined}
        />
      )}
    </BaseModal>
    
    {/* Settings Modal */}
    <MeetingsSettingsModal
      isOpen={showSettingsModal}
      onClose={() => {
        setShowSettingsModal(false);
        // Reload settings to update 24h format preference
        loadData();
      }}
    />
    
    {/* Meeting Types Modal */}
    {settings?.organization_id && (
      <MeetingTypesModal
        isOpen={showTypesModal}
        onClose={() => {
          setShowTypesModal(false);
          // Reload meeting types after changes
          loadData();
        }}
        organizationId={settings.organization_id}
      />
    )}
    
    {/* Event Details Modal */}
    <EventDetailsModal
      isOpen={showEventDetailsModal}
      onClose={() => {
        setShowEventDetailsModal(false);
        setSelectedEvent(null);
      }}
      event={selectedEvent}
      isAdmin={true}
      onEdit={(event: any) => {
        // Close event details and open booking form in edit mode
        setShowEventDetailsModal(false);
        // TODO: Populate form with event data for editing
        console.log('Edit event:', event);
      }}
      onCancel={async (eventId: string) => {
        if (!settings?.organization_id) return;
        
        try {
          const response = await fetch(`/api/meetings/bookings/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organization_id: settings.organization_id,
              status: 'cancelled',
            }),
          });
          
          if (!response.ok) throw new Error('Failed to cancel event');
          
          // Reload calendar events
          await loadData();
          setShowEventDetailsModal(false);
          setSelectedEvent(null);
        } catch (err) {
          console.error('Error canceling event:', err);
          setError('Failed to cancel event');
        }
      }}
      onDelete={async (eventId: string) => {
        if (!settings?.organization_id) return;
        
        try {
          const response = await fetch(
            `/api/meetings/bookings/${eventId}?organization_id=${settings.organization_id}`,
            {
              method: 'DELETE',
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Delete failed:', response.status, errorData);
            throw new Error(errorData.error || 'Failed to delete event');
          }
          
          // Reload calendar events
          await loadData();
          setShowEventDetailsModal(false);
          setSelectedEvent(null);
        } catch (err) {
          console.error('Error deleting event:', err);
          setError(err instanceof Error ? err.message : 'Failed to delete event');
        }
      }}
      onStatusChange={async (eventId: string, newStatus: string) => {
        if (!settings?.organization_id) return;
        
        try {
          const response = await fetch(`/api/meetings/bookings/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organization_id: settings.organization_id,
              status: newStatus,
            }),
          });
          
          if (!response.ok) throw new Error('Failed to update status');
          
          // Reload calendar events
          await loadData();
          
          // Update selected event in modal
          if (selectedEvent) {
            setSelectedEvent({ ...selectedEvent, status: newStatus });
          }
        } catch (err) {
          console.error('Error updating status:', err);
          setError('Failed to update event status');
        }
      }}
    />
    </>
  );
}
