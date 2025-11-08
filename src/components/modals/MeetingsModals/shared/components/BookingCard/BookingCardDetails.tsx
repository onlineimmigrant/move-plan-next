'use client';

import React from 'react';
import { format } from 'date-fns';
import { 
  ClockIcon, 
  UserIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { type Booking } from '@/context/MeetingContext';
import WaitingRoomControls from '../../../WaitingRoom/WaitingRoomControls';

interface BookingCardDetailsProps {
  booking: Booking;
  variant: 'admin' | 'customer';
  primaryColor: string;
  showWaitingRoomControls?: boolean;
  currentUserId?: string;
  organizationId?: string;
}

export function BookingCardDetails({
  booking,
  variant,
  primaryColor,
  showWaitingRoomControls,
  currentUserId,
  organizationId,
}: BookingCardDetailsProps) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
      {/* Email */}
      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
        <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primaryColor }} />
        <span className="truncate">
          {variant === 'admin' 
            ? booking.customer_email 
            : (booking as any).host?.email || 'Not specified'}
        </span>
      </div>
      
      {/* Duration */}
      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
        <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primaryColor }} />
        <span>
          {format(new Date(booking.scheduled_at), 'h:mm a')} • {booking.duration_minutes} minutes
        </span>
      </div>
      
      {/* Meeting Type (if not already shown in header badge) */}
      {booking.meeting_type && (
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <VideoCameraIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primaryColor }} />
          <span>{(booking.meeting_type as any).name}</span>
        </div>
      )}
      
      {/* Notes */}
      {booking.notes && (
        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400 mt-2">
          <ChatBubbleLeftIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
          <p className="italic line-clamp-3">
            "{booking.notes}"
          </p>
        </div>
      )}
      
      {/* Admin-Only: Waiting Room Controls */}
      {variant === 'admin' && showWaitingRoomControls && currentUserId && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <WaitingRoomControls 
            hostUserId={currentUserId}
            organizationId={organizationId}
          />
        </div>
      )}
    </div>
  );
}
