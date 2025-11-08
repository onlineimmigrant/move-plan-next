'use client';

import React, { useState, lazy, Suspense } from 'react';
import { type BookingCardProps } from './types';
import { getCardStyles, getTimeUntilMeeting } from './utils';
import { BookingCardHeader } from './BookingCardHeader';
import { BookingCardActions } from './BookingCardActions';

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Theme color - extract from props or use default
  const primaryColor = '#3b82f6'; // blue-500 as default, can be passed as prop later

  // Calculate styles and states
  const cardStyles = getCardStyles(booking, primaryColor);
  const timeInfo = getTimeUntilMeeting(booking);
  const isLive = timeInfo.isInProgress;
  
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

  return (
    <>
      <div
        className="relative rounded-lg p-4 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
        style={{
          backgroundColor: cardStyles.backgroundColor,
          border: `${cardStyles.borderWidth} solid ${cardStyles.borderColor}`,
          opacity: cardStyles.opacity || 1,
        }}
      >
        {/* Header - Clickable to open modal */}
        <BookingCardHeader
          booking={booking}
          variant={variant}
          isLive={isLive}
          primaryColor={primaryColor}
          onClick={handleViewDetails}
        />

        {/* Actions - Always Visible */}
        <div className="mt-3">
          <BookingCardActions
            booking={booking}
            canJoin={canJoinNow}
            isJoining={isJoining}
            isLive={isLive}
            primaryColor={primaryColor}
            hoveredButton={hoveredButton}
            onJoin={handleJoin}
            onCancel={handleCancel}
            onHoverStart={() => setHoveredButton(booking.id)}
            onHoverEnd={() => setHoveredButton(null)}
          />
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
