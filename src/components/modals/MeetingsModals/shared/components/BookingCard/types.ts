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
