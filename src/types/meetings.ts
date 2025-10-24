// /src/types/meetings.ts
// TypeScript types for the Meetings system

export interface MeetingType {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_minutes: number;
  is_active: boolean;
  color?: string;
  icon?: string;
  is_customer_choice: boolean; // Whether customers can select this type when booking
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySchedule {
  id: string;
  organization_id: string;
  user_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  organization_id: string;
  meeting_type_id?: string;
  meeting_type?: MeetingType;
  host_user_id: string;
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: BookingStatus;
  meeting_room_id?: string;
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  // Waiting room fields
  waiting_since?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export type ParticipantRole = 'host' | 'attendee' | 'co_host';

export interface MeetingParticipant {
  id: string;
  booking_id: string;
  user_id?: string;
  email?: string;
  name: string;
  role: ParticipantRole;
  joined_at?: string;
  left_at?: string;
  duration_minutes?: number;
  created_at: string;
}

export type MeetingRoomStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface MeetingRoom {
  id: string;
  booking_id: string;
  twilio_room_sid: string;
  twilio_room_name: string;
  status: MeetingRoomStatus;
  max_participants: number;
  record_participants_on_connect: boolean;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

// UI-specific types
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  booking?: Booking;
  isBusinessHours?: boolean; // For admin view: indicates if slot falls within customer business hours
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: string;
  status?: BookingStatus;
  description?: string;
  backgroundColor?: string;
  extendedProps?: {
    booking?: Partial<Booking> & {
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      meeting_type_id?: string;
      meeting_type_name?: string;
      meeting_type_color?: string;
    };
    meetingType?: MeetingType;
  };
}

export interface BookingFormData {
  meeting_type_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  timezone: string;
  duration_minutes: number;
  host_user_id?: string;
}

export interface AvailabilityFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: boolean;
}

// API Response types
export interface AvailabilityResponse {
  available_slots: TimeSlot[];
  timezone: string;
}

export interface BookingConflict {
  booking_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  host_name?: string;
}

// Twilio Video types
export interface TwilioRoomToken {
  token: string;
  room_name: string;
  identity: string;
}

export interface VideoParticipant {
  identity: string;
  name?: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarFilters {
  view: CalendarView;
  date: Date;
  host_user_id?: string;
  status?: BookingStatus[];
  meeting_type_id?: string;
}