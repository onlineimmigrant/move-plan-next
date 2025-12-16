'use client';

import React, { useState, lazy, Suspense, useEffect } from 'react';
import { format } from 'date-fns/format';
import { type BookingCardProps } from './types';
import { getCardStyles, getTimeUntilMeeting, getRelativeTime, shouldShowCountdown } from './utils';
import { supabase } from '@/lib/supabaseClient';
import { triggerBadgeRefresh } from '@/components/modals/UnifiedMenu/hooks/useBadgeRefresh';

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
  const [isViewed, setIsViewed] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);

  // Check if current user has viewed this meeting
  useEffect(() => {
    if (currentUserId && booking.viewed_by) {
      const viewedBy = Array.isArray(booking.viewed_by) ? booking.viewed_by : [];
      setIsViewed(viewedBy.includes(currentUserId));
    }
  }, [booking.viewed_by, currentUserId]);

  // Prefetch event details on hover for instant modal opening
  const handleMouseEnter = async () => {
    if (!isPrefetched && organizationId) {
      setIsPrefetched(true);
      try {
        // Prefetch event details from API
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch(`/api/meetings/bookings/${booking.id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }).catch(() => {}); // Silent prefetch - errors don't matter
        }
      } catch (err) {
        // Silent fail - prefetch is optimization, not critical
      }
    }
  };

  // Mark meeting as viewed when details modal opens
  const markAsViewed = async () => {
    if (!currentUserId || isViewed) return;

    try {
      const viewedBy = Array.isArray(booking.viewed_by) ? booking.viewed_by : [];
      
      if (!viewedBy.includes(currentUserId)) {
        const { error } = await supabase
          .from('bookings')
          .update({ viewed_by: [...viewedBy, currentUserId] })
          .eq('id', booking.id);

        if (error) {
          console.error('Error marking meeting as viewed:', error);
        } else {
          setIsViewed(true);
          triggerBadgeRefresh(); // Update badge counts
        }
      }
    } catch (err) {
      console.error('Error in markAsViewed:', err);
    }
  };

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

  const handleViewDetails = () => {
    markAsViewed(); // Mark as viewed when opening details
    setShowDetailsModal(true);
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
        className="relative rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 backdrop-blur-sm border"
        style={{
          backgroundColor: cardStyles.backgroundColor,
          borderColor: cardStyles.borderColor,
          borderWidth: cardStyles.borderWidth,
          opacity: cardStyles.opacity || 1,
        }}
        onMouseEnter={handleMouseEnter}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/30 dark:bg-gray-800/30">
          {/* Left: Icon + Title + Date/Time (matching modal header) */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleViewDetails}>
            <div className="flex items-center gap-2">
              {/* Colored circle for meeting type */}
              <div
                className="w-5 h-5 rounded-full ring-2 ring-white/50 dark:ring-gray-700/50 flex-shrink-0"
                style={{ backgroundColor: meetingTypeColor }}
                title={(booking.meeting_type as any)?.name || 'Meeting'}
              />
              <h3 
                className={`text-base font-semibold truncate ${
                  isInactive ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {(booking.meeting_type as any)?.name || booking.title}
              </h3>
              
              {/* "New" Badge for unviewed meetings */}
              {!isViewed && !isInactive && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  NEW
                </span>
              )}
              
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
            </div>
            
            {/* Date, time and relative time */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {format(startDate, 'EEEE, MMM d, yyyy')} • {format(startDate, 'h:mm a')}
              {!isInactive && (
                <span 
                  className="ml-1 font-semibold"
                  style={{ color: meetingTypeColor }}
                >
                  • {getRelativeTime(booking.scheduled_at)}
                </span>
              )}
            </p>
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
            onJoin={(event) => {
              onJoin(event as any);
              setShowDetailsModal(false);
            }}
            isJoining={isJoining}
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
