'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy, memo } from 'react';
import { format } from 'date-fns';
import { Rnd } from 'react-rnd';
import { ArrowLeftIcon, CalendarIcon, UserGroupIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Calendar, BookingForm, AriaLiveRegion, useAriaLiveAnnouncer } from '@/components/modals/MeetingsModals/shared/components';
import MyBookingsList from './MyBookingsList';
import {
  MeetingsBookingModalProps,
  TimeSlot
} from '../shared/types';
import {
  useBookingState,
  useCalendarState,
  useMeetingTypes,
  useKeyboardShortcuts
} from '../shared/hooks';
import { useCustomerBookingData } from './hooks';
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

// Lazy load EventDetailsModal
const EventDetailsModal = lazy(() => import('../EventDetailsModal').then(m => ({ default: m.EventDetailsModal })));
import { logError } from '../shared/utils/errorHandling';

/**
 * Customer-facing booking modal for scheduling meetings
 * 
 * Features:
 * - Calendar view for selecting dates
 * - Time slot selection
 * - Booking form with validation
 * - My bookings list
 * - Guest booking support
 * - Keyboard shortcuts (ESC to close)
 * - Screen reader announcements
 * 
 * @example
 * ```tsx
 * <MeetingsBookingModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onBookingSuccess={(id) => console.log('Booked:', id)}
 * />
 * ```
 */
export default function MeetingsBookingModal({ isOpen, onClose, preselectedSlot, onBookingSuccess, prefilledData }: MeetingsBookingModalProps) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Focus trap refs
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const isInitialMount = useRef(true);

  // Tab state - Default to 'book-new' (Create tab) to match admin behavior
  const [activeTab, setActiveTab] = useState<'my-meetings' | 'book-new'>('book-new');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<'calendar' | 'booking'>(MODAL_VIEWS.CALENDAR);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Custom hooks for state management
  const bookingState = useBookingState();
  const calendarState = useCalendarState();
  const { meetingTypes, isLoading: loadingMeetingTypes, error: meetingTypesError } = useMeetingTypes(
    settings?.organization_id,
    false // isAdmin = false for customer modal
  );

  // Customer booking data hook
  const {
    customerEmail,
    loadingCustomerData,
    loadCustomerEmail,
    loadEvents,
    loadAvailableSlots,
  } = useCustomerBookingData({
    organizationId: settings?.organization_id,
    bookingState,
    calendarState,
    onError: setError,
  });

  // Accessibility features
  const { announce, announcement } = useAriaLiveAnnouncer();

  // Memoize computed values
  const isMobile = useMemo(() => 
    typeof window !== 'undefined' && window.innerWidth < 640,
    []
  );

  const shouldShowNavFooter = useMemo(() => 
    currentView === 'calendar' && activeTab === 'book-new',
    [currentView, activeTab]
  );

  // Memoize tab styles
  const getTabStyle = useCallback((isActive: boolean, isHovered: boolean) => 
    isActive ? {
      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
      color: 'white',
      boxShadow: isHovered ? `0 4px 12px ${primary.base}40` : `0 2px 4px ${primary.base}30`,
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    } : {
      backgroundColor: 'transparent',
      color: isHovered ? primary.hover : primary.base,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: isHovered ? `${primary.base}80` : `${primary.base}40`,
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    },
    [primary.base, primary.hover]
  );

  // Memoize navigation button styles
  const navButtonStyle = useMemo(() => ({
    backgroundColor: `${primary.base}20`,
    color: primary.base,
  }), [primary.base]);

  const continueButtonStyle = useMemo(() => ({
    background: `linear-gradient(to right, ${primary.base}, ${primary.hover})`,
  }), [primary.base, primary.hover]);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Initial data loading - load silently without showing skeleton
  useEffect(() => {
    if (!isOpen) {
      isInitialMount.current = true; // Reset for next open
      return;
    }
    
    if (!settings?.organization_id) return;

    const loadData = async () => {
      setError(null);
      try {
        // Load events silently (showLoading = false) - no skeleton on first load
        await loadEvents(false);
      } catch (err) {
        console.error('Error loading meeting data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meeting data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
    // Only run on modal open/close and organization change, NOT on date/view changes
    // Date/view changes are handled by loadEvents internal dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings?.organization_id]);

  // Reload events when calendar date or view changes (with loading indicator)
  // Skip on initial mount to avoid duplicate load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (isOpen && settings?.organization_id) {
      loadEvents(true); // Show loading skeleton when navigating
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarState.currentDate, calendarState.calendarView]);

  // Load available slots when a slot is selected
  useEffect(() => {
    if (bookingState.selectedSlot) {
      loadAvailableSlots(bookingState.selectedSlot.start);
    }
    // loadAvailableSlots is stable from useCustomerBookingData hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingState.selectedSlot]);

  // Memoized navigation handlers
  const handlePrevDate = useCallback(() => {
    const newDate = calendarState.calendarView === 'month' 
      ? new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() - 1, 1)
      : calendarState.calendarView === 'week'
      ? new Date(calendarState.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(calendarState.currentDate.getTime() - 24 * 60 * 60 * 1000);
    calendarState.setCurrentDate(newDate);
  }, [calendarState.currentDate, calendarState.calendarView, calendarState.setCurrentDate]);

  const handleNextDate = useCallback(() => {
    const newDate = calendarState.calendarView === 'month' 
      ? new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 1)
      : calendarState.calendarView === 'week'
      ? new Date(calendarState.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(calendarState.currentDate.getTime() + 24 * 60 * 60 * 1000);
    calendarState.setCurrentDate(newDate);
  }, [calendarState.currentDate, calendarState.calendarView, calendarState.setCurrentDate]);

  const handleToday = useCallback(() => {
    calendarState.setCurrentDate(new Date());
  }, [calendarState.setCurrentDate]);

  const handleSlotClick = useCallback(async (date: Date, hour?: number) => {
    setSelectedDate(date);
    
    // On desktop (screen width >= 640px), immediately proceed to booking
    // On mobile, just select the date and show "Continue" button
    if (window.innerWidth >= 640) {
      // Desktop: immediate navigation with loading skeleton
      loadAvailableSlots(date, true); // Show loading skeleton on user action
      setCurrentView(MODAL_VIEWS.BOOKING);
      
      if (!customerEmail || !bookingState.formData.customer_email) {
        loadCustomerEmail();
      }
    }
  }, [customerEmail, bookingState.formData.customer_email, loadAvailableSlots, loadCustomerEmail]);

  const handleCalendarBackgroundClick = useCallback(() => {
    // Deselect date to allow exploration (mobile only)
    setSelectedDate(null);
  }, []);

  const handleProceedToBooking = useCallback(async () => {
    if (!selectedDate) return;
    
    // Load available slots for the selected date with loading skeleton
    loadAvailableSlots(selectedDate, true);

    // Switch to booking view immediately (slots will load in background)
    setCurrentView(MODAL_VIEWS.BOOKING);

    // Load customer email in background if we don't have it (don't await - non-blocking)
    if (!customerEmail || !bookingState.formData.customer_email) {
      loadCustomerEmail(); // Don't await - let it load in background
    }
  }, [selectedDate, customerEmail, bookingState.formData.customer_email, loadAvailableSlots, loadCustomerEmail]);

  const handleBookingSubmit = useCallback(async (data: any) => {
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
          case_id: prefilledData?.caseId || data.case_id || null,
          customer_id: prefilledData?.customerId || data.customer_id || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const booking = result.booking || result;
        const bookingId = booking.id || result.id || result.booking_id;

        // Announce success to screen readers
        announce('Booking created successfully', 'polite');

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
        const errorMessage = errorData.error || UI_CONSTANTS.ERROR_MESSAGES.VALIDATION_ERROR;
        setError(errorMessage);
        // Announce error to screen readers
        announce(`Booking error: ${errorMessage}`, 'assertive');
      }
    } catch (err) {
      logError(err, { context: 'Error creating booking' });
      const errorMessage = UI_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR;
      setError(errorMessage);
      // Announce error to screen readers
      announce(`Booking error: ${errorMessage}`, 'assertive');
    } finally {
      bookingState.setIsSubmitting(false);
    }
  }, [settings?.organization_id, bookingState, announce, onBookingSuccess, onClose, loadEvents, prefilledData]);

  const handleEventClick = useCallback((event: any) => {
    // Convert CalendarEvent to EventDetails format
    const eventDetails = {
      id: event.id,
      title: event.title,
      scheduled_at: event.start instanceof Date ? event.start.toISOString() : event.start,
      duration_minutes: event.extendedProps?.booking?.duration_minutes || 
                        event.extendedProps?.meetingType?.duration_minutes || 60,
      customer_name: event.extendedProps?.booking?.customer_name || 'Unknown',
      customer_email: event.extendedProps?.booking?.customer_email || '',
      customer_phone: event.extendedProps?.booking?.customer_phone,
      notes: event.extendedProps?.booking?.notes || event.description,
      status: event.status || 'confirmed',
      meeting_type: event.extendedProps?.meetingType ? {
        id: event.extendedProps.meetingType.id,
        name: event.extendedProps.meetingType.name,
        color: event.extendedProps.meetingType.color,
        duration_minutes: event.extendedProps.meetingType.duration_minutes,
      } : undefined,
      created_at: event.extendedProps?.booking?.created_at || new Date().toISOString(),
      updated_at: event.extendedProps?.booking?.updated_at || new Date().toISOString(),
    };
    setSelectedEvent(eventDetails);
    setShowEventDetailsModal(true);
  }, []);

  const handleBookingFormChange = useCallback((data: Partial<any>) => {
    bookingState.updateFormData(data);
  }, [bookingState]);

  const handleBackToCalendar = useCallback(() => {
    // Keep customer email and name when going back
    const customerData = {
      customer_email: bookingState.formData.customer_email,
      customer_name: bookingState.formData.customer_name,
    };
    bookingState.resetForm(customerData);
    setCurrentView(MODAL_VIEWS.CALENDAR);
    setActiveTab('book-new'); // Stay on book-new tab
    setSelectedDate(null); // Reset selected date
  }, [bookingState]);

  const handleClose = useCallback(() => {
    setCurrentView(MODAL_VIEWS.CALENDAR);
    bookingState.resetForm({
      customer_email: bookingState.formData.customer_email,
      customer_name: bookingState.formData.customer_name,
    });
    setError(null);
    onClose();
  }, [bookingState, onClose]);

  // Keyboard shortcuts - defined after handleClose
  useKeyboardShortcuts({
    onEscape: handleClose,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <MeetingsErrorBoundary>
      {/* ARIA live region for screen reader announcements */}
      <AriaLiveRegion
        message={announcement.message}
        politeness={announcement.politeness}
        clearAfter={5000}
      />
      
      <div
        className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10002]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 ${isMobile ? 'bg-black/50 backdrop-blur-sm' : ''}`}
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
                        style={getTabStyle(activeTab === 'book-new', hoveredTab === 'book-new')}
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
                          style={getTabStyle(activeTab === 'my-meetings', hoveredTab === 'my-meetings')}
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
                      <div 
                        className="overflow-y-auto" 
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        onClick={(e) => {
                          // If clicking on the background (not a date), deselect
                          if (e.target === e.currentTarget) {
                            handleCalendarBackgroundClick();
                          }
                        }}
                      >
                        <Calendar
                          events={calendarState.events}
                          currentDate={calendarState.currentDate}
                          view={calendarState.calendarView}
                          onDateChange={calendarState.setCurrentDate}
                          onViewChange={calendarState.setCalendarView}
                          onEventClick={handleEventClick}
                          onSlotClick={handleSlotClick}
                          loading={false}
                          disableSwipe={true}
                          highlightedDate={selectedDate}
                        />
                      </div>
                    )}
                  </div>
                </>
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
            {shouldShowNavFooter && (
              <div className="sm:hidden border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
                {selectedDate ? (
                  /* Show Next Button when date is selected */
                  <button
                    onClick={handleProceedToBooking}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg"
                    style={continueButtonStyle}
                  >
                    <span>Continue with {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  /* Show calendar navigation when no date selected */
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handlePrevDate}
                      className="p-2 rounded-lg transition-colors duration-200"
                      style={navButtonStyle}
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
                )}
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
                          style={getTabStyle(activeTab === 'book-new', hoveredTab === 'book-new')}
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
                            style={getTabStyle(activeTab === 'my-meetings', hoveredTab === 'my-meetings')}
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
                      ) : initialLoading || calendarState.isLoading ? (
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
                        <div 
                          className="overflow-y-auto" 
                          style={{ WebkitOverflowScrolling: 'touch' }}
                          onClick={(e) => {
                            // If clicking on the background (not a date), deselect
                            if (e.target === e.currentTarget) {
                              handleCalendarBackgroundClick();
                            }
                          }}
                        >
                          <Calendar
                            events={calendarState.events}
                            currentDate={calendarState.currentDate}
                            view={calendarState.calendarView}
                            onDateChange={calendarState.setCurrentDate}
                            onViewChange={calendarState.setCalendarView}
                            onEventClick={handleEventClick}
                            onSlotClick={handleSlotClick}
                            loading={false}
                            use24Hour={true}
                            disableSwipe={true}
                            highlightedDate={selectedDate}
                          />
                        </div>
                      )}
                    </div>
                  </>
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
              {shouldShowNavFooter && (
                <div className="sm:hidden border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handlePrevDate}
                      className="p-2 rounded-lg transition-colors duration-200"
                      style={navButtonStyle}
                      aria-label="Previous"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleToday}
                      className="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      style={navButtonStyle}
                    >
                      Today
                    </button>
                    <button
                      onClick={handleNextDate}
                      className="p-2 rounded-lg transition-colors duration-200"
                      style={navButtonStyle}
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

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <Suspense fallback={<div>Loading...</div>}>
          <EventDetailsModal
            isOpen={showEventDetailsModal}
            onClose={() => {
              setShowEventDetailsModal(false);
              setSelectedEvent(null);
            }}
            event={selectedEvent}
            isAdmin={false}
          />
        </Suspense>
      )}
    </MeetingsErrorBoundary>
  );
}