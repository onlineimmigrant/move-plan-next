'use client';

import React from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { type Booking } from '@/context/MeetingContext';
import { getRelativeTime, getTimeUntilMeeting, shouldShowCountdown } from './utils';

interface BookingCardHeaderProps {
  booking: Booking;
  variant: 'admin' | 'customer';
  isLive: boolean;
  primaryColor: string;
  onClick: () => void;
}

export function BookingCardHeader({
  booking,
  variant,
  isLive,
  primaryColor,
  onClick,
}: BookingCardHeaderProps) {
  const timeInfo = getTimeUntilMeeting(booking);
  const diffMins = timeInfo.diffMins;
  const showCountdown = shouldShowCountdown(booking);
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const isInactive = isCancelled || isCompleted;

  return (
    <div 
      className="cursor-pointer select-none group"
      onClick={onClick}
    >
      {/* Row 1: Title + Status + View Details Icon */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <h4 
            className={`text-base font-semibold truncate ${
              isInactive ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
            }`}
            title={booking.title}
          >
            {booking.title}
          </h4>
          
          {/* Meeting Type Badge */}
          {booking.meeting_type && (
            <span 
              className="inline-block px-2 py-0.5 rounded text-xs font-medium mt-1"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor
              }}
            >
              {(booking.meeting_type as any).name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live Indicator (pulsing dot) */}
          {isLive && !isInactive && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                <span 
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: primaryColor }}
                ></span>
              </span>
            </div>
          )}
          
          {/* Status Badge */}
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: isCancelled
                ? '#fee2e2'
                : isCompleted
                ? '#f3f4f6'
                : isLive
                ? `${primaryColor}20`
                : booking.status === 'waiting'
                ? '#fef3c7'
                : '#d1fae5',
              color: isCancelled
                ? '#991b1b'
                : isCompleted
                ? '#4b5563'
                : isLive
                ? primaryColor
                : booking.status === 'waiting'
                ? '#92400e'
                : '#065f46'
            }}
          >
            {isCancelled && '✕ Cancelled'}
            {isCompleted && '✓ Completed'}
            {!isInactive && booking.status === 'waiting' && '⏳ Waiting'}
            {!isInactive && isLive && '● Live'}
            {!isInactive && !isLive && booking.status === 'confirmed' && '✓ Confirmed'}
            {!isInactive && !isLive && booking.status === 'scheduled' && '📅 Scheduled'}
          </span>
          
          {/* Countdown Badge */}
          {showCountdown && (
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded animate-pulse"
              style={{
                backgroundColor: diffMins <= 5 ? '#fef3c7' : '#fef3c7',
                color: diffMins <= 5 ? '#92400e' : '#92400e'
              }}
            >
              ⏰ {diffMins} min
            </span>
          )}
          
          {/* View Details Icon */}
          <ArrowRightIcon 
            className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
            style={{ color: primaryColor }}
            title="View Details"
          />
        </div>
      </div>
      
      {/* Row 2: Critical Info (Date, Time, Countdown) */}
      <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
          <span className="font-medium">{format(new Date(booking.scheduled_at), 'EEE, MMM d')}</span>
        </div>
        <span className="text-gray-400">•</span>
        <div className="flex items-center gap-1.5">
          <ClockIcon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
          <span>{format(new Date(booking.scheduled_at), 'h:mm a')}</span>
        </div>
        <span className="text-gray-400">•</span>
        <span 
          className="font-semibold"
          style={{ color: isLive ? '#dc2626' : primaryColor }}
        >
          {getRelativeTime(booking.scheduled_at)}
        </span>
      </div>
      
      {/* Row 3: Customer/Host Name */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <UserIcon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
        <span className="truncate">
          {variant === 'admin' 
            ? `${booking.customer_name}` 
            : (booking as any).host?.full_name || 'Host not specified'}
        </span>
      </div>
    </div>
  );
}
