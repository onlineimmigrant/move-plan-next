import { type Booking } from '@/context/MeetingContext';

export interface BookingCardProps {
  booking: Booking;
  variant: 'admin' | 'customer';
  
  // Event handlers
  onJoin: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
  
  // State
  isJoining?: boolean;
  currentUserId?: string;
  userRole?: string;
  
  // Optional overrides
  defaultExpanded?: boolean;
  showWaitingRoomControls?: boolean;
  organizationId?: string;
}

export interface TimeInfo {
  isInProgress: boolean;
  canJoin: boolean;
  timeUntilStart: number;
  formattedTime: string;
}

export interface CardStyles {
  borderColor: string;
  backgroundColor: string;
  borderWidth: string;
  opacity?: number;
}

export enum ExpansionPriority {
  LIVE = 3,           // Currently in progress → ALWAYS expanded
  URGENT = 2,         // Starting ≤15 min → AUTO expanded
  TODAY = 1,          // Starting today → CLOSED but highlighted
  FUTURE = 0,         // Future meetings → CLOSED
  PAST = -1           // Completed/Cancelled → CLOSED
}
