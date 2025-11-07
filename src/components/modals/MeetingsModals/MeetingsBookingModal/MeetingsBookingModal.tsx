'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Rnd } from 'react-rnd';
import { ArrowLeftIcon, CalendarIcon, UserGroupIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Calendar, BookingForm } from '@/components/modals/MeetingsModals/shared/components';
import MyBookingsList from './MyBookingsList';
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
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function MeetingsBookingModal({ isOpen, onClose, preselectedSlot, onBookingSuccess }: MeetingsBookingModalProps) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Focus trap refs
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Tab state - Default to 'book-new' (Create tab) to match admin behavior
  const [activeTab, setActiveTab] = useState<'my-meetings' | 'book-new'>('book-new');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

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

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift+Tab: going backward
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab: going forward
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Load customer email on mount
  useEffect(() => {
    if (isOpen) {
      loadCustomerEmail();
    }
  }, [isOpen]);

  const loadCustomerEmail = async () => {
    setLoadingCustomerData(true);
    try {
      // Get authenticated user (optional for public booking pages)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No authenticated user - allow guest booking (for public appointment pages)
        console.log('[Customer Modal] No authenticated user - guest booking mode enabled');
        setLoadingCustomerData(false);
        return;
      }

      // Try to get email from profiles table first (more reliable)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      const email = profile?.email || user.email;
      const customerName = profile?.full_name || '';

      console.log('[Customer Modal] Profile data:', { 
        email, 
        customerName, 
        hasProfile: !!profile,
        fullNameInProfile: profile?.full_name 
      });

      if (!email) {
        console.log('[Customer Modal] No email found - guest booking mode enabled');
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
        const calendarEvents: any[] = customerBookings.map((booking: any) => ({
          id: booking.id,
          title: booking.title,
          start: new Date(booking.scheduled_at),
          end: new Date(new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000),
          backgroundColor: getStatusColor(booking.status),
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
      bookingState.setIsLoadingSlots(true);
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
    } finally {
      bookingState.setIsLoadingSlots(false);
    }
  };

  const handleSlotClick = async (date: Date, hour?: number) => {
    // Load available slots for the selected date
    loadAvailableSlots(date);

    // Switch to booking view immediately (slots will load in background)
    setCurrentView(MODAL_VIEWS.BOOKING);

    // Only load customer email if authenticated and we don't already have it
    if (customerEmail && !bookingState.formData.customer_email) {
      setLoadingCustomerData(true);
      await loadCustomerEmail();
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
        const booking = result.booking || result;
        const bookingId = booking.id || result.id || result.booking_id;

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user && bookingId) {
          // For unauthenticated users, call success callback with booking data
          if (onBookingSuccess) {
            onBookingSuccess(booking);
          } else {
            // Fallback: show alert and open video call link
            const videoCallUrl = `${window.location.origin}/video-call/${bookingId}`;
            alert(`Appointment booked successfully! You can join the meeting at:\n${videoCallUrl}\n\nThis link has been sent to your email.`);
            window.open(videoCallUrl, '_blank');
            onClose();
          }
        } else {
          // For authenticated users, refresh events and switch to Manage tab
          await loadEvents();

          // Switch to "Manage" tab to show the newly created booking
          setActiveTab('my-meetings');
          
          // Reset form and go back to calendar
          setCurrentView(MODAL_VIEWS.CALENDAR);
          bookingState.resetForm({
            customer_email: bookingState.formData.customer_email,
            customer_name: bookingState.formData.customer_name,
          });
        }
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

  const handleBackToCalendar = () => {
    // Keep customer email and name when going back
    const customerData = {
      customer_email: bookingState.formData.customer_email,
      customer_name: bookingState.formData.customer_name,
    };
    bookingState.resetForm(customerData);
    setCurrentView(MODAL_VIEWS.CALENDAR);
    setActiveTab('book-new'); // Stay on book-new tab
  };

  const handleClose = () => {
    setCurrentView(MODAL_VIEWS.CALENDAR);
    bookingState.resetForm({
      customer_email: bookingState.formData.customer_email,
      customer_name: bookingState.formData.customer_name,
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <MeetingsErrorBoundary>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10002]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal - Draggable & Resizable on Desktop */}
        {isMobile ? (
          /* Mobile: Fixed fullscreen */
          <div
            ref={modalRef}
            className="relative w-full h-[90vh] flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                {activeTab === 'my-meetings' ? (
                  <UserGroupIcon className="w-6 h-6" style={{ color: primary.base }} />
                ) : (
                  <CalendarIcon className="w-6 h-6" style={{ color: primary.base }} />
                )}
                <h2
                  id="booking-modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Appointments
                </h2>
              </div>
              <button
                ref={firstFocusableRef}
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close modal (Esc)"
                title="Close (Esc)"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content with tabs */}
            <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20 flex flex-col">
              {currentView !== MODAL_VIEWS.BOOKING ? (
                <>
                  {/* Tab Navigation - Only show if not in booking view */}
                  <div className="px-4 pt-3 pb-3">
                    <nav className="flex gap-2" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('book-new')}
                        onMouseEnter={() => setHoveredTab('book-new')}
                        onMouseLeave={() => setHoveredTab(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                        style={
                          activeTab === 'book-new'
                            ? {
                                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                                color: 'white',
                                boxShadow: hoveredTab === 'book-new' 
                                  ? `0 4px 12px ${primary.base}40` 
                                  : `0 2px 4px ${primary.base}30`,
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: hoveredTab === 'book-new' ? primary.hover : primary.base,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: hoveredTab === 'book-new' ? `${primary.base}80` : `${primary.base}40`,
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                              }
                        }
                      >
                        <span>Book</span>
                      </button>
                      {customerEmail && (
                        <button
                          ref={lastFocusableRef}
                          onClick={() => setActiveTab('my-meetings')}
                          onMouseEnter={() => setHoveredTab('my-meetings')}
                          onMouseLeave={() => setHoveredTab(null)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                          style={
                            activeTab === 'my-meetings'
                              ? {
                                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                                  color: 'white',
                                  boxShadow: hoveredTab === 'my-meetings' 
                                    ? `0 4px 12px ${primary.base}40` 
                                    : `0 2px 4px ${primary.base}30`,
                                  touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent',
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  color: hoveredTab === 'my-meetings' ? primary.hover : primary.base,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  borderColor: hoveredTab === 'my-meetings' ? `${primary.base}80` : `${primary.base}40`,
                                  touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent',
                                }
                          }
                        >
                          <UserGroupIcon className="w-4 h-4" />
                          <span>Manage</span>
                        </button>
                      )}
                    </nav>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {error && (
                      <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    )}
                    {activeTab === 'my-meetings' ? (
                      <MyBookingsList organizationId={settings?.organization_id} />
                    ) : calendarState.isLoading ? (
                      <CalendarLoading />
                    ) : meetingTypes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="text-gray-500 dark:text-gray-400 mb-4">
                          <CalendarIcon className="mx-auto h-12 w-12" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No Appointment Types Available
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Please check your organization settings or contact support.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                      </div>
                    )}
                  </div>
                </>
              ) : loadingCustomerData ? (
                <div className="p-6">
                  <CustomerDataLoading />
                </div>
              ) : (
                <BookingForm
                  formData={bookingState.formData}
                  availableSlots={bookingState.availableSlots}
                  meetingTypes={meetingTypes}
                  onChange={handleBookingFormChange}
                  onSubmit={handleBookingSubmit}
                  onCancel={handleBackToCalendar}
                  onBackToCalendar={handleBackToCalendar}
                  isSubmitting={bookingState.isSubmitting}
                  isLoadingSlots={bookingState.isLoadingSlots}
                  errors={bookingState.errors}
                  readOnlyEmail={!!customerEmail}
                  selectedSlot={bookingState.selectedSlot}
                />
              )}
            </div>

            {/* Fixed Navigation Footer - Mobile Only, Calendar View Only */}
            {currentView === 'calendar' && activeTab === 'book-new' && (
              <div className="sm:hidden border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newDate = calendarState.calendarView === 'month' 
                        ? new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() - 1, 1)
                        : calendarState.calendarView === 'week'
                        ? new Date(calendarState.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                        : new Date(calendarState.currentDate.getTime() - 24 * 60 * 60 * 1000);
                      calendarState.setCurrentDate(newDate);
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
                    onClick={() => calendarState.setCurrentDate(new Date())}
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
                      const newDate = calendarState.calendarView === 'month' 
                        ? new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 1)
                        : calendarState.calendarView === 'week'
                        ? new Date(calendarState.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                        : new Date(calendarState.currentDate.getTime() + 24 * 60 * 60 * 1000);
                      calendarState.setCurrentDate(newDate);
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
              x: window.innerWidth / 2 - 560,
              y: Math.max(50, window.innerHeight / 2 - 450),
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
            <div
              ref={modalRef}
              className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Draggable */}
              <div className="modal-drag-handle cursor-move flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  {activeTab === 'my-meetings' ? (
                    <UserGroupIcon className="w-6 h-6" style={{ color: primary.base }} />
                  ) : (
                    <CalendarIcon className="w-6 h-6" style={{ color: primary.base }} />
                  )}
                  <h2
                    id="booking-modal-title"
                    className="text-xl font-semibold text-gray-900 dark:text-white"
                  >
                    Appointments
                  </h2>
                </div>
                <button
                  ref={firstFocusableRef}
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close modal (Esc)"
                  title="Close (Esc)"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20 min-h-0 flex flex-col">
                {currentView !== MODAL_VIEWS.BOOKING ? (
                  <>
                    {/* Tab Navigation - Only show if not in booking view */}
                    <div className="px-4 sm:px-6 pt-4 pb-2">
                      <nav className="flex gap-2 sm:gap-3" aria-label="Tabs">
                        <button
                          onClick={() => setActiveTab('book-new')}
                          onMouseEnter={() => setHoveredTab('book-new')}
                          onMouseLeave={() => setHoveredTab(null)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                          style={
                            activeTab === 'book-new'
                              ? {
                                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                                  color: 'white',
                                  boxShadow: hoveredTab === 'book-new' 
                                    ? `0 4px 12px ${primary.base}40` 
                                    : `0 2px 4px ${primary.base}30`
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  color: hoveredTab === 'book-new' ? primary.hover : primary.base,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  borderColor: hoveredTab === 'book-new' ? `${primary.base}80` : `${primary.base}40`
                                }
                          }
                        >
                          <span>Book</span>
                        </button>
                        {/* Only show Manage tab for authenticated users */}
                        {customerEmail && (
                          <button
                            ref={lastFocusableRef}
                            onClick={() => setActiveTab('my-meetings')}
                            onMouseEnter={() => setHoveredTab('my-meetings')}
                            onMouseLeave={() => setHoveredTab(null)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                            style={
                              activeTab === 'my-meetings'
                                ? {
                                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                                    color: 'white',
                                    boxShadow: hoveredTab === 'my-meetings' 
                                      ? `0 4px 12px ${primary.base}40` 
                                      : `0 2px 4px ${primary.base}30`
                                  }
                                : {
                                    backgroundColor: 'transparent',
                                    color: hoveredTab === 'my-meetings' ? primary.hover : primary.base,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: hoveredTab === 'my-meetings' ? `${primary.base}80` : `${primary.base}40`
                                  }
                            }
                          >
                            <UserGroupIcon className="w-4 h-4" />
                            <span>Manage</span>
                          </button>
                        )}
                      </nav>
                    </div>

                    {/* Calendar/List Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                      {/* Error Message */}
                      {error && (
                        <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                      )}

                      {/* Content */}
                      {activeTab === 'my-meetings' ? (
                        <MyBookingsList organizationId={settings?.organization_id} />
                      ) : calendarState.isLoading ? (
                        <CalendarLoading />
                      ) : meetingTypes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <div className="text-gray-500 dark:text-gray-400 mb-4">
                            <CalendarIcon className="mx-auto h-12 w-12" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Appointment Types Available
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Please check your organization settings or contact support.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                        </div>
                      )}
                    </div>
                  </>
                ) : loadingCustomerData ? (
                  <div className="p-6">
                    <CustomerDataLoading />
                  </div>
                ) : (
                  <BookingForm
                    formData={bookingState.formData}
                    availableSlots={bookingState.availableSlots}
                    meetingTypes={meetingTypes}
                    onChange={handleBookingFormChange}
                    onSubmit={handleBookingSubmit}
                    onCancel={handleBackToCalendar}
                    onBackToCalendar={handleBackToCalendar}
                    isSubmitting={bookingState.isSubmitting}
                    isLoadingSlots={bookingState.isLoadingSlots}
                    errors={bookingState.errors}
                    readOnlyEmail={!!customerEmail}
                    selectedSlot={bookingState.selectedSlot}
                  />
                )}
              </div>

              {/* Fixed Navigation Footer - Mobile Only, Calendar View Only */}
              {currentView === 'calendar' && activeTab === 'book-new' && (
                <div className="sm:hidden border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        const newDate = calendarState.calendarView === 'month' 
                          ? new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() - 1, 1)
                          : calendarState.calendarView === 'week'
                          ? new Date(calendarState.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                          : new Date(calendarState.currentDate.getTime() - 24 * 60 * 60 * 1000);
                        calendarState.setCurrentDate(newDate);
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
                      onClick={() => calendarState.setCurrentDate(new Date())}
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
                        const newDate = calendarState.calendarView === 'month' 
                          ? new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 1)
                          : calendarState.calendarView === 'week'
                          ? new Date(calendarState.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                          : new Date(calendarState.currentDate.getTime() + 24 * 60 * 60 * 1000);
                        calendarState.setCurrentDate(newDate);
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
    </MeetingsErrorBoundary>
  );
}