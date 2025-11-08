'use client';

import React from 'react';
import { VideoCameraIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { type Booking } from '@/context/MeetingContext';

interface BookingCardActionsProps {
  booking: Booking;
  canJoin: boolean;
  isJoining: boolean;
  isLive: boolean;
  primaryColor: string;
  hoveredButton: string | null;
  onJoin: () => void;
  onCancel: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export function BookingCardActions({
  booking,
  canJoin,
  isJoining,
  isLive,
  primaryColor,
  hoveredButton,
  onJoin,
  onCancel,
  onHoverStart,
  onHoverEnd,
}: BookingCardActionsProps) {
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const isInactive = isCancelled || isCompleted;

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
      {/* Left: In-Progress Indicator or Cancel Button */}
      <div className="flex items-center gap-2">
        {/* In-Progress Pulsing Indicator */}
        {isLive && !isInactive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: primaryColor }}
              ></span>
              <span 
                className="relative inline-flex rounded-full h-3 w-3"
                style={{ backgroundColor: primaryColor }}
              ></span>
            </span>
            <span className="text-xs font-semibold" style={{ color: primaryColor }}>
              Live now
            </span>
          </div>
        )}
        
        {/* Cancel Button */}
        {!isInactive && !isLive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </button>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex gap-2">
        {canJoin && !isInactive ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
            disabled={isJoining}
            className={`inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              isJoining
                ? 'bg-gray-400 text-white cursor-wait'
                : ''
            }`}
            style={
              isJoining
                ? undefined
                : {
                    background: hoveredButton === booking.id
                      ? `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`
                      : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    color: 'white',
                    boxShadow: hoveredButton === booking.id ? `0 4px 12px ${primaryColor}40` : 'none'
                  }
            }
          >
            {isJoining ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </>
            ) : (
              <>
                <VideoCameraIcon className="w-4 h-4 mr-1" />
                Join{isLive ? ' Now' : ' Meeting'}
              </>
            )}
          </button>
        ) : isCompleted ? (
          <span className="text-xs text-gray-400 px-3 py-2">Meeting ended</span>
        ) : isCancelled ? (
          <span className="text-xs text-gray-400 px-3 py-2">Cancelled</span>
        ) : !canJoin && !isInactive ? (
          <button
            disabled
            className="inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm cursor-not-allowed"
            style={{
              backgroundColor: 'transparent',
              color: '#9ca3af',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#e5e7eb',
            }}
          >
            <ClockIcon className="w-4 h-4 mr-1" />
            Not available
          </button>
        ) : null}
      </div>
    </div>
  );
}
