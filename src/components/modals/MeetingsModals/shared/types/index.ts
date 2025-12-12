/**
 * Shared TypeScript types for Meetings Modals
 * Used by both MeetingsBookingModal and MeetingsAdminModal
 */

import type {
  MeetingType,
  Booking,
  MeetingParticipant,
  AvailabilitySchedule,
  TimeSlot,
  CalendarEvent,
  BookingFormData,
  AvailabilityFormData,
  CalendarView,
  CalendarFilters
} from '@/types/meetings';

// ============================================================================
// Core Meeting Types - SHARED
// ============================================================================

export type {
  MeetingType,
  Booking,
  MeetingParticipant,
  AvailabilitySchedule,
  TimeSlot,
  CalendarEvent,
  BookingFormData,
  AvailabilityFormData,
  CalendarView,
  CalendarFilters
} from '@/types/meetings';

// ============================================================================
// UI State Types - SHARED
// ============================================================================

export type WidgetSize = 'initial' | 'half' | 'fullscreen';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export interface ModalState {
  isOpen: boolean;
  size: WidgetSize;
  activeView: 'calendar' | 'booking' | 'details' | 'availability';
}

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedSlot?: TimeSlot;
  events: CalendarEvent[];
  loading: boolean;
}

export interface BookingState {
  formData: Partial<BookingFormData>;
  availableSlots: TimeSlot[];
  conflicts: any[];
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}

export interface AvailabilityState {
  schedules: AvailabilitySchedule[];
  formData: Partial<AvailabilityFormData>;
  isSubmitting: boolean;
  timezone: string;
}

// ============================================================================
// Component Props Types - SHARED
// ============================================================================

export interface MeetingsBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSlot?: TimeSlot;
  preselectedMeetingType?: MeetingType;
  onBookingSuccess?: (booking: any) => void; // Callback when booking is successfully created
  prefilledData?: {
    customerId?: string;
    caseId?: string | null;
  };
}

export interface MeetingsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'calendar' | 'availability' | 'bookings';
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (slot: TimeSlot) => void;
  loading?: boolean;
}

export interface BookingFormProps {
  formData: Partial<BookingFormData>;
  availableSlots: TimeSlot[];
  meetingTypes: MeetingType[];
  onChange: (data: Partial<BookingFormData>) => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

export interface AvailabilityManagerProps {
  schedules: AvailabilitySchedule[];
  onAdd: (schedule: AvailabilityFormData) => Promise<void>;
  onUpdate: (id: string, schedule: AvailabilityFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

// ============================================================================
// API Types - SHARED
// ============================================================================

export interface CreateBookingRequest {
  meeting_type_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  timezone: string;
  duration_minutes: number;
}

export interface UpdateBookingRequest {
  title?: string;
  description?: string;
  status?: string;
  notes?: string;
}

export interface GetAvailabilityRequest {
  host_user_id: string;
  date: string;
  timezone: string;
  duration_minutes: number;
}

export interface GetAvailabilityResponse {
  available_slots: TimeSlot[];
  timezone: string;
  conflicts: any[];
}

// ============================================================================
// Hook Return Types - SHARED
// ============================================================================

export interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEvent: (booking: Booking) => void;
  updateEvent: (bookingId: string, updates: Partial<Booking>) => void;
  deleteEvent: (bookingId: string) => void;
}

export interface UseAvailabilityReturn {
  schedules: AvailabilitySchedule[];
  loading: boolean;
  error: string | null;
  createSchedule: (data: AvailabilityFormData) => Promise<void>;
  updateSchedule: (id: string, data: AvailabilityFormData) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  getAvailableSlots: (date: string, duration: number) => Promise<TimeSlot[]>;
}

export interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  createBooking: (data: CreateBookingRequest) => Promise<Booking>;
  updateBooking: (id: string, data: UpdateBookingRequest) => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  getBooking: (id: string) => Promise<Booking | null>;
}