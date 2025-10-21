/**
 * Constants and enums for Meetings Modals
 * Centralized configuration for consistent behavior across components
 */

import { CalendarView } from '../types';

// ============================================================================
// CALENDAR CONSTANTS
// ============================================================================

export const CALENDAR_VIEWS = {
  MONTH: 'month' as CalendarView,
  WEEK: 'week' as CalendarView,
  DAY: 'day' as CalendarView,
} as const;

export const CALENDAR_VIEW_LABELS = {
  [CALENDAR_VIEWS.MONTH]: 'Month',
  [CALENDAR_VIEWS.WEEK]: 'Week',
  [CALENDAR_VIEWS.DAY]: 'Day',
} as const;

// ============================================================================
// BOOKING STATUSES
// ============================================================================

export const BOOKING_STATUSES = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUSES.SCHEDULED]: 'Scheduled',
  [BOOKING_STATUSES.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUSES.COMPLETED]: 'Completed',
  [BOOKING_STATUSES.CANCELLED]: 'Cancelled',
  [BOOKING_STATUSES.NO_SHOW]: 'No Show',
} as const;

// ============================================================================
// MODAL VIEW STATES
// ============================================================================

export const MODAL_VIEWS = {
  CALENDAR: 'calendar',
  BOOKING: 'booking',
  DETAILS: 'details',
  AVAILABILITY: 'availability',
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME_CONSTANTS = {
  SLOT_DURATION_MINUTES: 30,
  BUSINESS_HOURS_START: '09:00',
  BUSINESS_HOURS_END: '17:00',
  BUFFER_TIME_MINUTES: 15,
  MAX_ADVANCE_BOOKING_DAYS: 90,
  MIN_ADVANCE_BOOKING_HOURS: 2,
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  MEETINGS: {
    TYPES: '/api/meetings/types',
    BOOKINGS: '/api/meetings/bookings',
    AVAILABILITY: '/api/meetings/available-slots',
    SETTINGS: '/api/meetings/settings',
  },
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONSTANTS = {
  MODAL_SIZES: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg',
    EXTRA_LARGE: 'xl',
    FULL: 'full',
  } as const,

  LOADING_STATES: {
    INITIAL: 'Loading calendar...',
    EVENTS: 'Loading events...',
    SLOTS: 'Loading available slots...',
    SUBMITTING: 'Creating booking...',
    CUSTOMER_DATA: 'Loading your information...',
  } as const,

  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    VALIDATION_ERROR: 'Please correct the errors below and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
  } as const,
} as const;

// ============================================================================
// EVENT TYPES
// ============================================================================

export const EVENT_TYPES = {
  MEETING_BOOKING: 'meeting_booking',
  AVAILABILITY_BLOCK: 'availability_block',
  HOLIDAY: 'holiday',
  MAINTENANCE: 'maintenance',
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  MODAL: {
    CLOSE: 'Escape',
    SUBMIT: 'Enter',
    BACK: 'Backspace',
  },
  CALENDAR: {
    TODAY: 't',
    NEXT: 'ArrowRight',
    PREVIOUS: 'ArrowLeft',
    MONTH_VIEW: 'm',
    WEEK_VIEW: 'w',
    DAY_VIEW: 'd',
  },
} as const;