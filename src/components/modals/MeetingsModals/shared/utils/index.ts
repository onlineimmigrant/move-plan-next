/**
 * Shared utility functions for Meetings Modals
 */

import { format, parseISO, addMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { TimeSlot, Booking, MeetingType, CalendarEvent } from '../types';

// ============================================================================
// TIME & DATE UTILITIES
// ============================================================================

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const parseTimeString = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// ============================================================================
// TIME SLOT UTILITIES
// ============================================================================

export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  duration: number,
  interval: number = 15
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);

  let current = new Date(start);

  while (current < end) {
    const slotEnd = addMinutes(current, duration);
    if (slotEnd <= end) {
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: true,
      });
    }
    current = addMinutes(current, interval);
  }

  return slots;
};

export const checkSlotAvailability = (
  slot: TimeSlot,
  bookings: Booking[],
  bufferMinutes: number = 0
): { available: boolean; conflicts: Booking[] } => {
  const slotStart = slot.start;
  const slotEnd = slot.end;
  const bufferedStart = addMinutes(slotStart, -bufferMinutes);
  const bufferedEnd = addMinutes(slotEnd, bufferMinutes);

  const conflicts = bookings.filter(booking => {
    const bookingStart = parseISO(booking.scheduled_at);
    const bookingEnd = addMinutes(bookingStart, booking.duration_minutes);

    return (
      booking.status !== 'cancelled' &&
      isWithinInterval(bookingStart, { start: bufferedStart, end: bufferedEnd }) ||
      isWithinInterval(bookingEnd, { start: bufferedStart, end: bufferedEnd }) ||
      isWithinInterval(bufferedStart, { start: bookingStart, end: bookingEnd }) ||
      isWithinInterval(bufferedEnd, { start: bookingStart, end: bookingEnd })
    );
  });

  return {
    available: conflicts.length === 0,
    conflicts,
  };
};

export const filterAvailableSlots = (
  slots: TimeSlot[],
  bookings: Booking[],
  bufferMinutes: number = 0
): TimeSlot[] => {
  return slots.map(slot => {
    const { available, conflicts } = checkSlotAvailability(slot, bookings, bufferMinutes);
    return {
      ...slot,
      available,
      booking: conflicts[0], // Include first conflict for reference
    };
  });
};

// ============================================================================
// CALENDAR EVENT UTILITIES
// ============================================================================

export const bookingToCalendarEvent = (booking: Booking, meetingType?: MeetingType): CalendarEvent => {
  const start = parseISO(booking.scheduled_at);
  const end = addMinutes(start, booking.duration_minutes);

  return {
    id: booking.id,
    title: booking.title,
    start,
    end,
    backgroundColor: meetingType?.color || '#3B82F6',
    extendedProps: {
      booking,
      meetingType,
    },
  };
};

export const bookingsToCalendarEvents = (bookings: Booking[], meetingTypes: MeetingType[] = []): CalendarEvent[] => {
  return bookings.map(booking => {
    const meetingType = meetingTypes.find(mt => mt.id === booking.meeting_type_id);
    return bookingToCalendarEvent(booking, meetingType);
  });
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateBookingForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.meeting_type_id) {
    errors.meeting_type_id = 'Meeting type is required';
  }

  if (!data.customer_name?.trim()) {
    errors.customer_name = 'Customer name is required';
  }

  if (!data.customer_email?.trim()) {
    errors.customer_email = 'Customer email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
    errors.customer_email = 'Please enter a valid email address';
  }

  if (!data.title?.trim()) {
    errors.title = 'Meeting title is required';
  }

  if (!data.scheduled_at) {
    errors.scheduled_at = 'Meeting time is required';
  }

  if (!data.timezone) {
    errors.timezone = 'Timezone is required';
  }

  if (!data.duration_minutes || data.duration_minutes < 15) {
    errors.duration_minutes = 'Duration must be at least 15 minutes';
  }

  return errors;
};

export const validateAvailabilityForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (data.day_of_week === undefined || data.day_of_week < 0 || data.day_of_week > 6) {
    errors.day_of_week = 'Please select a valid day';
  }

  if (!data.start_time) {
    errors.start_time = 'Start time is required';
  }

  if (!data.end_time) {
    errors.end_time = 'End time is required';
  }

  if (data.start_time && data.end_time && data.start_time >= data.end_time) {
    errors.end_time = 'End time must be after start time';
  }

  if (!data.timezone) {
    errors.timezone = 'Timezone is required';
  }

  return errors;
};

// ============================================================================
// TIMEZONE UTILITIES
// ============================================================================

export const getTimezoneOptions = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ];
};

export const getDayOfWeekOptions = (): Array<{ value: number; label: string }> => {
  return [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];
};

// ============================================================================
// MEETING TYPE UTILITIES
// ============================================================================

export const getDefaultMeetingTypes = (): Partial<MeetingType>[] => {
  return [
    {
      name: 'Consultation',
      description: 'General consultation meeting',
      duration_minutes: 30,
      buffer_minutes: 15,
      color: '#3B82F6',
      icon: 'calendar',
    },
    {
      name: 'Support Call',
      description: 'Technical support and troubleshooting',
      duration_minutes: 45,
      buffer_minutes: 15,
      color: '#10B981',
      icon: 'headphones',
    },
    {
      name: 'Product Demo',
      description: 'Product demonstration and walkthrough',
      duration_minutes: 60,
      buffer_minutes: 30,
      color: '#F59E0B',
      icon: 'presentation',
    },
  ];
};

// ============================================================================
// CONTAINER STYLES UTILITY
// ============================================================================

export const getContainerClasses = (size: 'initial' | 'half' | 'fullscreen'): string => {
  const baseClasses = 'bg-white rounded-lg shadow-xl overflow-hidden';

  switch (size) {
    case 'initial':
      return `${baseClasses} w-full max-w-md mx-4`;
    case 'half':
      return `${baseClasses} w-full max-w-2xl mx-4 h-[80vh]`;
    case 'fullscreen':
      return `${baseClasses} w-full h-full max-w-none mx-0`;
    default:
      return `${baseClasses} w-full max-w-md mx-4`;
  }
};