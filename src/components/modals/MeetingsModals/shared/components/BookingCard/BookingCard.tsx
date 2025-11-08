'use client';

import React, { useState, useMemo } from 'react';
import { type BookingCardProps } from './types';
import { getCardStyles, getExpansionPriority, getTimeUntilMeeting } from './utils';
import { BookingCardHeader } from './BookingCardHeader';
import { BookingCardDetails } from './BookingCardDetails';
import { BookingCardActions } from './BookingCardActions';
import { ExpansionPriority } from './types';

export function BookingCard({
  booking,
  variant,
  onJoin,
  onCancel,
  isJoining = false,
  currentUserId,
  userRole,
  defaultExpanded,
  showWaitingRoomControls = false,
  organizationId,
}: BookingCardProps) {
  // Determine if should auto-expand
  const shouldAutoExpand = useMemo(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    const priority = getExpansionPriority(booking);
    return priority >= ExpansionPriority.URGENT; // Auto-expand LIVE and URGENT
  }, [booking, defaultExpanded]);

  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);
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

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleJoin = () => {
    onJoin(booking);
  };

  const handleCancel = () => {
    onCancel(booking.id);
  };

  return (
    <div
      className="relative rounded-lg p-4 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
      style={{
        backgroundColor: cardStyles.backgroundColor,
        border: `${cardStyles.borderWidth} solid ${cardStyles.borderColor}`,
        opacity: cardStyles.opacity || 1,
      }}
    >
      {/* Header - Always Visible */}
      <BookingCardHeader
        booking={booking}
        variant={variant}
        isExpanded={isExpanded}
        isLive={isLive}
        primaryColor={primaryColor}
        onToggle={handleToggle}
      />

      {/* Details - Collapsible */}
      {isExpanded && (
        <BookingCardDetails
          booking={booking}
          variant={variant}
          primaryColor={primaryColor}
          showWaitingRoomControls={showWaitingRoomControls}
          currentUserId={currentUserId}
          organizationId={organizationId}
        />
      )}

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
  );
}
