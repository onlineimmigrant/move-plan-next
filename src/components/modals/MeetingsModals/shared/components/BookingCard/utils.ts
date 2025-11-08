import { type Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';
import { CardStyles, ExpansionPriority } from './types';

/**
 * Calculate relative time display
 */
export const getRelativeTime = (scheduledAt: string): string => {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const diffMs = scheduled.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 0) return 'Started';
  if (diffMins < 1) return 'Starting now';
  if (diffMins < 60) return `in ${diffMins} min`;
  if (diffHours < 24) return `in ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  return format(scheduled, 'MMM d');
};

/**
 * Get time until meeting in minutes
 */
export const getTimeUntilMeeting = (booking: Booking) => {
  const now = new Date();
  const scheduled = new Date(booking.scheduled_at);
  const endTime = new Date(scheduled.getTime() + booking.duration_minutes * 60000);
  
  const diffMs = scheduled.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  const isInProgress = now >= scheduled && now < endTime;
  
  return {
    isInProgress,
    diffMins,
    scheduled,
    endTime,
  };
};

/**
 * Determine expansion priority based on meeting state
 */
export const getExpansionPriority = (booking: Booking): ExpansionPriority => {
  const timeInfo = getTimeUntilMeeting(booking);
  const diffMins = timeInfo.diffMins;
  
  // Inactive meetings always collapsed
  if (['cancelled', 'completed'].includes(booking.status)) {
    return ExpansionPriority.PAST;
  }
  
  // Live meetings always expanded
  if (timeInfo.isInProgress) {
    return ExpansionPriority.LIVE;
  }
  
  // Starting soon - auto-expand
  if (diffMins > 0 && diffMins <= 15) {
    return ExpansionPriority.URGENT;
  }
  
  // Today but not urgent
  const isToday = new Date(booking.scheduled_at).toDateString() === new Date().toDateString();
  if (isToday) {
    return ExpansionPriority.TODAY;
  }
  
  return ExpansionPriority.FUTURE;
};

/**
 * Get card visual styles based on urgency
 */
export const getCardStyles = (booking: Booking, primaryColor: string): CardStyles => {
  const isInactive = ['cancelled', 'completed'].includes(booking.status);
  
  if (isInactive) {
    return {
      borderColor: '#e5e7eb',      // gray-200
      backgroundColor: '#f9fafb',   // gray-50
      borderWidth: '1px',
      opacity: 0.7
    };
  }
  
  const timeInfo = getTimeUntilMeeting(booking);
  const diffMins = timeInfo.diffMins;
  
  // LIVE (red theme)
  if (timeInfo.isInProgress) {
    return {
      borderColor: '#dc2626',       // red-600
      backgroundColor: '#fee2e2',   // red-50
      borderWidth: '2px'
    };
  }
  
  // URGENT (green theme) - ≤15 min
  if (diffMins > 0 && diffMins <= 15) {
    return {
      borderColor: '#16a34a',       // green-600
      backgroundColor: '#dcfce7',   // green-50
      borderWidth: '2px'
    };
  }
  
  // TODAY (yellow theme)
  const isToday = new Date(booking.scheduled_at).toDateString() === new Date().toDateString();
  if (isToday) {
    return {
      borderColor: '#eab308',       // yellow-500
      backgroundColor: '#fef9c3',   // yellow-50
      borderWidth: '2px'
    };
  }
  
  // FUTURE (neutral)
  return {
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: '1px'
  };
};

/**
 * Check if countdown should be shown
 */
export const shouldShowCountdown = (booking: Booking): boolean => {
  const timeInfo = getTimeUntilMeeting(booking);
  const diffMins = timeInfo.diffMins;
  const isInactive = ['cancelled', 'completed'].includes(booking.status);
  
  return diffMins > 0 && diffMins <= 30 && !isInactive && !timeInfo.isInProgress;
};
