'use client';

import React, { useState, lazy, Suspense } from 'react';
import { format } from 'date-fns';
import { 
  XMarkIcon,
  ArrowRightCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { type BookingCardProps } from './types';
import { getCardStyles, getTimeUntilMeeting, getRelativeTime, shouldShowCountdown } from './utils';

// Lazy load EventDetailsModal
const EventDetailsModal = lazy(() => import('../../../EventDetailsModal/EventDetailsModal'));

export function BookingCard({
  booking,
  variant,
  onJoin,
  onCancel,
  isJoining = false,
  currentUserId,
  userRole,
  organizationId,
}: BookingCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Theme color - extract from meeting type or use default
  const meetingTypeColor = (booking.meeting_type as any)?.color || '#3b82f6';

  // Calculate styles and states
  const cardStyles = getCardStyles(booking, meetingTypeColor);
  const timeInfo = getTimeUntilMeeting(booking);
  const isLive = timeInfo.isInProgress;
  const showCountdown = shouldShowCountdown(booking);
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const isInactive = isCancelled || isCompleted;
  
  // Determine if user can join
  const isAdmin = userRole === 'admin';
  const isHost = currentUserId === booking.host_user_id;
  const isAdminOrHost = isAdmin || isHost;
  
  const canJoinNow = 
    !['cancelled', 'completed', 'no_show'].includes(booking.status) &&
    (isAdminOrHost || timeInfo.isInProgress || timeInfo.diffMins <= 15);

  const handleViewDetails = () => {
    setShowDetailsModal(true);
  };

  const handleJoin = () => {
    onJoin(booking);
  };

  const handleCancel = () => {
    onCancel(booking.id);
  };

  // Convert booking to EventDetails format for modal
  const eventDetails = {
    ...booking,
    status: booking.status as 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled',
    customer_name: booking.customer_name || '',
    customer_email: booking.customer_email || '',
  };

  const startDate = new Date(booking.scheduled_at);
  const diffMins = timeInfo.diffMins;

  return (
    <>
      {/* Card styled like EventDetailsModal header */}
      <div
        className="relative rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-white/10"
        style={{
          backgroundColor: cardStyles.backgroundColor,
          borderColor: cardStyles.borderColor,
          borderWidth: cardStyles.borderWidth,
          opacity: cardStyles.opacity || 1,
        }}
      >
        <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 gap-4">
          {/* Left: Icon + Title + Date/Time */}
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={handleViewDetails}
          >
            <div className="flex items-center gap-3">
              {/* Colored circle for meeting type */}
              <div
                className="w-5 h-5 rounded-full ring-2 ring-white/50 dark:ring-gray-700/50 flex-shrink-0"
                style={{ backgroundColor: meetingTypeColor }}
                title={(booking.meeting_type as any)?.name || 'Meeting'}
              />
              
              <div className="flex-1 min-w-0">
                <h3 
                  className={`text-base font-semibold truncate ${
                    isInactive ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                  }`}
                  title={booking.title}
                >
                  {booking.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  <span>{format(startDate, 'EEE, MMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{format(startDate, 'h:mm a')}</span>
                  {!isInactive && (
                    <>
                      <span>•</span>
                      <span 
                        className="font-semibold"
                        style={{ color: isLive ? '#dc2626' : meetingTypeColor }}
                      >
                        {getRelativeTime(booking.scheduled_at)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Indicator */}
            {isLive && !isInactive && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span 
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: '#dc2626' }}
                  ></span>
                  <span 
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ backgroundColor: '#dc2626' }}
                  ></span>
                </span>
                <span className="text-xs font-bold text-red-600">LIVE</span>
              </div>
            )}

            {/* Countdown Badge */}
            {showCountdown && (
              <span 
                className="text-xs font-bold px-2 py-1 rounded animate-pulse"
                style={{
                  backgroundColor: diffMins <= 5 ? '#fef3c7' : '#fef3c7',
                  color: diffMins <= 5 ? '#92400e' : '#92400e'
                }}
              >
                ⏰ {diffMins}m
              </span>
            )}

            {/* Join Meeting Button */}
            {canJoinNow && !isInactive && (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                style={{ 
                  backgroundColor: isLive ? '#dc2626' : meetingTypeColor,
                }}
                title="Join Meeting"
              >
                <ArrowRightCircleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{isJoining ? 'Joining...' : 'Join'}</span>
              </button>
            )}

            {/* Cancel Button (for non-cancelled, non-completed) */}
            {!isInactive && (
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Cancel Meeting"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}

            {/* View Details Arrow */}
            <button
              onClick={handleViewDetails}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              title="View Details"
            >
              <ClockIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal - Lazy Loaded */}
      {showDetailsModal && (
        <Suspense fallback={null}>
          <EventDetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            event={eventDetails}
            isAdmin={variant === 'admin'}
            onCancel={(eventId: string) => {
              onCancel(eventId);
              setShowDetailsModal(false);
            }}
            use24Hour={true}
          />
        </Suspense>
      )}
    </>
  );
}
