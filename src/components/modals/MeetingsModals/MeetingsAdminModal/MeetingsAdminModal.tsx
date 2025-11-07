'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Rnd } from 'react-rnd';
import { CalendarIcon, UserGroupIcon, ArrowLeftIcon, Cog6ToothIcon, ClockIcon, UsersIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { Calendar, BookingForm, BookingCardSkeleton } from '@/components/modals/MeetingsModals/shared/components';
import { CalendarEvent, CalendarView, BookingFormData, MeetingType, TimeSlot } from '../shared/types';
import MeetingsSettingsModal from '../MeetingsSettingsModal';
import MeetingTypesModal from '../MeetingTypesModal';
import { EventDetailsModal } from '../EventDetailsModal';
import InstantMeetingModal from '../InstantMeetingModal';
import AdminBookingsList from './AdminBookingsList';

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
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // View state
  const [currentView, setCurrentView] = useState<'calendar' | 'booking' | 'manage-bookings'>('calendar');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [showInstantMeetingModal, setShowInstantMeetingModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loadingEventDetails, setLoadingEventDetails] = useState(false);
  const [use24Hour, setUse24Hour] = useState<boolean>(true);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeBookingCount, setActiveBookingCount] = useState(0);
  const [meetingSettings, setMeetingSettings] = useState<{
    business_hours_start?: string;
    business_hours_end?: string;
    is_24_hours?: boolean;
  }>({});

  // Calendar state
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Data state
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Form state
  const [bookingFormData, setBookingFormData] = useState<Partial<BookingFormData>>({});

  // Fetch active booking count
  const fetchActiveBookingCount = useCallback(async () => {
    if (!settings?.organization_id) return;
    
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
  }, [settings?.organization_id]);

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

      // Helper function to get status color
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

      // Convert bookings to calendar events
      const calendarEvents: CalendarEvent[] = (bookingsData.bookings || []).map((booking: any) => ({
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
    fetchActiveBookingCount();
  }, [loadData, fetchActiveBookingCount]);

  // Listen for meeting types changes (when user edits them in settings)
  useEffect(() => {
    const handleRefresh = () => {
      loadData();
      fetchActiveBookingCount();
    };
    
    window.addEventListener('refreshMeetingTypes', handleRefresh);
    return () => window.removeEventListener('refreshMeetingTypes', handleRefresh);
  }, [loadData, fetchActiveBookingCount]);

  // Load available slots when needed
  const loadAvailableSlots = async (date: Date) => {
    if (!settings?.organization_id) return;

    try {
      setLoadingSlots(true);
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
      setLoadingSlots(false);
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
      await fetchActiveBookingCount();

      // Reset and redirect to manage view
      setBookingFormData({});
      setAvailableSlots([]);
      setCurrentView('manage-bookings');
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
    // Return simple "Appointments" string - BaseModal will add Admin badge
    return 'Appointments';
  };

  // Get subtitle
  const getSubtitle = () => {
    if (currentView === 'calendar') {
      return 'Calendar';
    }
    if (currentView === 'manage-bookings') {
      return 'Manage Bookings';
    }
    return 'New Booking';
  };

  // Header actions for calendar view only
  const headerActions = currentView === 'booking' ? null : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowTypesModal(true)}
        onMouseEnter={() => setHoveredTab('types')}
        onMouseLeave={() => setHoveredTab(null)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
        style={{
          color: hoveredTab === 'types' ? primary.hover : primary.base,
          backgroundColor: hoveredTab === 'types' ? `${primary.base}1a` : 'transparent'
        }}
        title="Manage appointment types"
      >
        <ClockIcon className="w-4 h-4" />
        Types
      </button>
      <button
        onClick={() => setShowSettingsModal(true)}
        onMouseEnter={() => setHoveredTab('settings')}
        onMouseLeave={() => setHoveredTab(null)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
        style={{
          color: hoveredTab === 'settings' ? primary.hover : primary.base,
          backgroundColor: hoveredTab === 'settings' ? `${primary.base}1a` : 'transparent'
        }}
        title="Configure appointment settings (including 24-hour format preference)"
      >
        <Cog6ToothIcon className="w-4 h-4" />
        Settings
      </button>
    </div>
  );

  if (!isOpen) return null;

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <>
    {!isOpen ? null : (
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10001]"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal - Responsive: Mobile fullscreen, Desktop draggable */}
        {isMobile ? (
          /* Mobile: Fixed fullscreen */
          <div
            className="relative w-full h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarIcon className="w-5 h-5 flex-shrink-0" style={{ color: primary.base }} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Appointments
                </h2>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {currentView !== 'booking' && (
                  <>
                    <button
                      onClick={() => setShowTypesModal(true)}
                      className="p-2 rounded-md transition-colors"
                      style={{ color: primary.base }}
                      title="Manage appointment types"
                    >
                      <ClockIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="p-2 rounded-md transition-colors"
                      style={{ color: primary.base }}
                      title="Configure appointment settings"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            {currentView !== 'booking' && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/20 dark:bg-gray-900/20">
                <button
                  onClick={() => setCurrentView('calendar')}
                  onMouseEnter={() => setHoveredTab('create')}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={
                    currentView === 'calendar'
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: hoveredTab === 'create' 
                            ? `0 4px 12px ${primary.base}40` 
                            : `0 2px 4px ${primary.base}30`
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredTab === 'create' ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredTab === 'create' ? `${primary.base}80` : `${primary.base}40`
                        }
                  }
                >
                  <CalendarIcon className="w-4 h-4" />
                  Book
                </button>
                <button
                  onClick={() => {
                    setCurrentView('manage-bookings');
                    fetchActiveBookingCount();
                  }}
                  onMouseEnter={() => setHoveredTab('manage')}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={
                    currentView === 'manage-bookings'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: hoveredTab === 'manage' 
                          ? `0 4px 12px ${primary.base}40` 
                          : `0 2px 4px ${primary.base}30`
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: hoveredTab === 'manage' ? primary.hover : primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: hoveredTab === 'manage' ? `${primary.base}80` : `${primary.base}40`
                      }
                  }
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>Manage</span>
                  {activeBookingCount > 0 && (
                    <span 
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                      style={{
                        backgroundColor: currentView === 'manage-bookings' ? 'rgba(255, 255, 255, 0.25)' : primary.base,
                        color: 'white'
                      }}
                    >
                      {activeBookingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowInstantMeetingModal(true)}
                  onMouseEnter={() => setHoveredTab('invite')}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: 'transparent',
                    color: hoveredTab === 'invite' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredTab === 'invite' ? `${primary.base}80` : `${primary.base}40`
                  }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Invite
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-900/20 min-h-0 overflow-hidden">
              {/* Error Message */}
              {error && (
                <div className="m-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {currentView === 'booking' ? (
                <div className="overflow-y-auto flex-1">
                  <BookingForm
                    formData={bookingFormData}
                    availableSlots={availableSlots}
                    meetingTypes={meetingTypes}
                    onChange={handleBookingFormChange}
                    onSubmit={handleBookingSubmit}
                    onCancel={() => setCurrentView('calendar')}
                    onBackToCalendar={() => setCurrentView('calendar')}
                    isSubmitting={submitting}
                    isLoadingSlots={loadingSlots}
                    errors={{}}
                    isAdmin={true}
                    timeFormat24={use24Hour}
                    businessHours={meetingSettings.business_hours_start && meetingSettings.business_hours_end ? {
                      start: meetingSettings.business_hours_start,
                      end: meetingSettings.business_hours_end
                    } : undefined}
                    selectedSlot={bookingFormData.scheduled_at ? availableSlots.find(slot => 
                      slot.start.toISOString() === bookingFormData.scheduled_at
                    ) || null : null}
                  />
                </div>
              ) : loading ? (
                <div className="overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 gap-4">
                    <BookingCardSkeleton count={3} />
                  </div>
                </div>
              ) : currentView === 'manage-bookings' ? (
                <AdminBookingsList organizationId={settings?.organization_id} />
              ) : currentView === 'calendar' ? (
                meetingTypes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                      <CalendarIcon className="mx-auto h-12 w-12" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Appointment Types Available</h3>
                    <p className="text-gray-500 dark:text-gray-400">Please create appointment types in organization settings first.</p>
                  </div>
                ) : (
                  <div className="p-4 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                  </div>
                )
              ) : null}
            </div>

            {/* Fixed Navigation Footer - Mobile Only, Calendar View Only */}
            {currentView === 'calendar' && (
              <div className="sm:hidden border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newDate = calendarView === 'month' 
                        ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                        : calendarView === 'week'
                        ? new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                        : new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
                      setCurrentDate(newDate);
                    }}
                    className="p-2 rounded-lg transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}20`,
                      color: primary.base 
                    }}
                    aria-label="Previous"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}20`,
                      color: primary.base 
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = calendarView === 'month' 
                        ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                        : calendarView === 'week'
                        ? new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                        : new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
                      setCurrentDate(newDate);
                    }}
                    className="p-2 rounded-lg transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}20`,
                      color: primary.base 
                    }}
                    aria-label="Next"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Draggable & Resizable */
        <Rnd
          default={{
            x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - 560,
            y: (typeof window !== 'undefined' ? window.innerHeight : 900) / 2 - 450,
            width: 1120,
            height: 900,
          }}
          minWidth={800}
          minHeight={700}
          bounds="window"
          dragHandleClassName="modal-drag-handle"
          enableResizing={true}
          className="pointer-events-auto"
        >
          <div className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20">
            
            {/* Header - Draggable */}
            <div className="modal-drag-handle flex items-center justify-between p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl cursor-move">
              <div className="flex items-center gap-3 min-w-0">
                <CalendarIcon className="w-6 h-6 flex-shrink-0" style={{ color: primary.base }} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  Appointments
                </h2>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentView !== 'booking' && (
                  <>
                    <button
                      onClick={() => setShowTypesModal(true)}
                      onMouseEnter={() => setHoveredTab('types')}
                      onMouseLeave={() => setHoveredTab(null)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                      style={{
                        color: hoveredTab === 'types' ? primary.hover : primary.base,
                        backgroundColor: hoveredTab === 'types' ? `${primary.base}1a` : 'transparent'
                      }}
                      title="Manage appointment types"
                    >
                      <ClockIcon className="w-4 h-4" />
                      Types
                    </button>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      onMouseEnter={() => setHoveredTab('settings')}
                      onMouseLeave={() => setHoveredTab(null)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                      style={{
                        color: hoveredTab === 'settings' ? primary.hover : primary.base,
                        backgroundColor: hoveredTab === 'settings' ? `${primary.base}1a` : 'transparent'
                      }}
                      title="Configure appointment settings"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      Settings
                    </button>
                  </>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            {currentView !== 'booking' && (
              <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 bg-white/20 dark:bg-gray-900/20">
                <button
                  onClick={() => setCurrentView('calendar')}
                  onMouseEnter={() => setHoveredTab('create')}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={
                    currentView === 'calendar'
                      ? {
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                          color: 'white',
                          boxShadow: hoveredTab === 'create' 
                            ? `0 4px 12px ${primary.base}40` 
                            : `0 2px 4px ${primary.base}30`
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: hoveredTab === 'create' ? primary.hover : primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: hoveredTab === 'create' ? `${primary.base}80` : `${primary.base}40`
                        }
                  }
                >
                  <CalendarIcon className="w-4 h-4" />
                  Book
                </button>
                <button
                  onClick={() => {
                    setCurrentView('manage-bookings');
                    fetchActiveBookingCount();
                  }}
                  onMouseEnter={() => setHoveredTab('manage')}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={
                    currentView === 'manage-bookings'
                    ? {
                        background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        color: 'white',
                        boxShadow: hoveredTab === 'manage' 
                          ? `0 4px 12px ${primary.base}40` 
                          : `0 2px 4px ${primary.base}30`
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: hoveredTab === 'manage' ? primary.hover : primary.base,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: hoveredTab === 'manage' ? `${primary.base}80` : `${primary.base}40`
                      }
                  }
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>Manage</span>
                  {activeBookingCount > 0 && (
                    <span 
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                      style={{
                        backgroundColor: currentView === 'manage-bookings' ? 'rgba(255, 255, 255, 0.25)' : primary.base,
                        color: 'white'
                      }}
                    >
                      {activeBookingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowInstantMeetingModal(true)}
                  onMouseEnter={() => setHoveredTab('invite')}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: 'transparent',
                    color: hoveredTab === 'invite' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredTab === 'invite' ? `${primary.base}80` : `${primary.base}40`
                  }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Invite
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-900/20 min-h-0 overflow-hidden">
              {/* Error Message */}
              {error && (
                <div className="m-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {currentView === 'booking' ? (
                <div className="p-6 overflow-y-auto flex-1">
                  <BookingForm
                    formData={bookingFormData}
                    availableSlots={availableSlots}
                    meetingTypes={meetingTypes}
                    onChange={handleBookingFormChange}
                    onSubmit={handleBookingSubmit}
                    onCancel={() => setCurrentView('calendar')}
                    onBackToCalendar={() => setCurrentView('calendar')}
                    isSubmitting={submitting}
                    isLoadingSlots={loadingSlots}
                    errors={{}}
                    isAdmin={true}
                    timeFormat24={use24Hour}
                    businessHours={meetingSettings.business_hours_start && meetingSettings.business_hours_end ? {
                      start: meetingSettings.business_hours_start,
                      end: meetingSettings.business_hours_end
                    } : undefined}
                    selectedSlot={bookingFormData.scheduled_at ? availableSlots.find(slot => 
                      slot.start.toISOString() === bookingFormData.scheduled_at
                    ) || null : null}
                  />
                </div>
              ) : loading ? (
                <div className="overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <BookingCardSkeleton count={6} />
                  </div>
                </div>
              ) : currentView === 'manage-bookings' ? (
                <AdminBookingsList organizationId={settings?.organization_id} />
              ) : currentView === 'calendar' ? (
                meetingTypes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                      <CalendarIcon className="mx-auto h-12 w-12" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Appointment Types Available</h3>
                    <p className="text-gray-500 dark:text-gray-400">Please create appointment types in organization settings first.</p>
                  </div>
                ) : (
                  <div className="p-4 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                  </div>
                )
              ) : null}
            </div>

            {/* Fixed Navigation Footer - Mobile Only, Calendar View Only */}
            {currentView === 'calendar' && (
              <div className="sm:hidden border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newDate = calendarView === 'month' 
                        ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                        : calendarView === 'week'
                        ? new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                        : new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
                      setCurrentDate(newDate);
                    }}
                    className="p-2 rounded-lg transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}20`,
                      color: primary.base 
                    }}
                    aria-label="Previous"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}20`,
                      color: primary.base 
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = calendarView === 'month' 
                        ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                        : calendarView === 'week'
                        ? new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                        : new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
                      setCurrentDate(newDate);
                    }}
                    className="p-2 rounded-lg transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primary.base}20`,
                      color: primary.base 
                    }}
                    aria-label="Next"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Rnd>
        )}
      </div>
    )}
    
    {/* Instant Meeting Modal */}
    <InstantMeetingModal
      isOpen={showInstantMeetingModal}
      onClose={() => setShowInstantMeetingModal(false)}
      onSuccess={() => {
        // AdminBookingsList will handle its own refresh via realtime subscriptions
        setShowInstantMeetingModal(false);
      }}
    />
    
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
      use24Hour={use24Hour}
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
