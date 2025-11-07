'use client';

import React, { useEffect, useState } from 'react';
import { 
  VideoCameraIcon, 
  ClockIcon, 
  CalendarIcon, 
  UserIcon,
  XMarkIcon,
  EyeIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { type Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Shared/ToastContainer';
import WaitingRoomControls from '../WaitingRoom/WaitingRoomControls';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BookingCardSkeleton } from '../shared/components';

interface AdminBookingsListProps {
  organizationId?: string;
}

export default function AdminBookingsList({ organizationId }: AdminBookingsListProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningBookingId, setJoiningBookingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredActionBtn, setHoveredActionBtn] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [limit, setLimit] = useState(10);
  const [activeCount, setActiveCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  
  const { 
    launchFromBooking, 
    canJoinMeeting, 
    getTimeUntilMeeting 
  } = useMeetingLauncher();
  
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

  // Helper function for relative time display
  const getRelativeTime = (scheduledAt: string) => {
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

  // Helper function to get status border color
  const getStatusBorderColor = (booking: Booking, timeInfo: any) => {
    if (booking.status === 'cancelled') return '#ef4444'; // red
    if (booking.status === 'completed') return '#6b7280'; // gray
    if (timeInfo.isInProgress) return primary.base; // primary
    
    // Urgent warning for meetings starting soon
    const diffMs = new Date(booking.scheduled_at).getTime() - new Date().getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins > 0 && diffMins <= 15) return '#f59e0b'; // amber
    
    return '#10b981'; // green for upcoming
  };

  // Get current user for waiting room controls
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    loadUser();
  }, []);

  // Fetch all organization bookings
  useEffect(() => {
    fetchBookings();
  }, [selectedStatus, showPast, limit]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session');
      }

      // Fetch all bookings without status filter to get counts
      const response = await fetch(`/api/meetings/bookings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.bookings)) {
        throw new Error('Invalid response format');
      }

      const now = new Date();
      
      // Calculate counts
      const allBookings = data.bookings;
      const active = allBookings.filter((b: Booking) => 
        !['cancelled', 'completed'].includes(b.status)
      );
      const past = allBookings.filter((b: Booking) => 
        ['cancelled', 'completed'].includes(b.status)
      );
      
      setActiveCount(active.length);
      setPastCount(past.length);
      
      // Filter based on showPast
      let filteredBookings = showPast ? past : active;
      
      // Apply status filter if not 'all'
      if (selectedStatus !== 'all') {
        filteredBookings = filteredBookings.filter((b: Booking) => b.status === selectedStatus);
      }
      
      // Apply limit
      filteredBookings = filteredBookings.slice(0, limit);
      
      // Smart sorting: prioritize by status and time
      const sortedBookings = filteredBookings.sort((a: Booking, b: Booking) => {
        const aTime = new Date(a.scheduled_at).getTime();
        const bTime = new Date(b.scheduled_at).getTime();
        const aEndTime = aTime + a.duration_minutes * 60000;
        const bEndTime = bTime + b.duration_minutes * 60000;
        
        // Priority 1: In-progress meetings (highest)
        const aInProgress = a.status === 'in_progress';
        const bInProgress = b.status === 'in_progress';
        if (aInProgress && !bInProgress) return -1;
        if (!aInProgress && bInProgress) return 1;
        
        // Priority 2: Upcoming active meetings (not cancelled/completed)
        const aIsActive = !['cancelled', 'completed'].includes(a.status) && aEndTime > now.getTime();
        const bIsActive = !['cancelled', 'completed'].includes(b.status) && bEndTime > now.getTime();
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        
        // Priority 3: Cancelled meetings
        const aIsCancelled = a.status === 'cancelled';
        const bIsCancelled = b.status === 'cancelled';
        if (aIsCancelled && !bIsCancelled) return 1;
        if (!aIsCancelled && bIsCancelled) return -1;
        
        // Within same category, sort by time (nearest first)
        return showPast ? bTime - aTime : aTime - bTime; // Reverse for past
      });

      setBookings(sortedBookings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(errorMessage);
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCall = async (booking: Booking) => {
    const timeInfo = getTimeUntilMeeting(booking);
    
    // Admins can join any time, but still validate status
    if (booking.status === 'cancelled' || booking.status === 'no_show' || booking.status === 'completed') {
      showError(`Cannot join: meeting is ${booking.status}`);
      return;
    }

    setJoiningBookingId(booking.id);
    showInfo('Joining video call as admin...');
    
    try {
      await launchFromBooking({ bookingId: booking.id });
      showSuccess('Video call started!');
    } catch (error) {
      console.error('Failed to join call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join video call';
      showError(errorMessage);
    } finally {
      setJoiningBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session');
      }

      const response = await fetch(`/api/meetings/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      showSuccess('Booking cancelled successfully');
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      showError('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BookingCardSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading bookings</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
        <button
          onClick={fetchBookings}
          className="mt-4 text-sm underline"
          style={{ color: primary.base }}
          onMouseEnter={(e) => e.currentTarget.style.color = primary.hover}
          onMouseLeave={(e) => e.currentTarget.style.color = primary.base}
        >
          Try again
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
        <p className="mt-1 text-sm text-gray-500">
          {selectedStatus !== 'all' 
            ? `No ${selectedStatus} bookings found.` 
            : 'No upcoming bookings found.'}
        </p>
        <button
          onClick={fetchBookings}
          className="mt-4 text-sm underline"
          style={{ color: primary.base }}
          onMouseEnter={(e) => e.currentTarget.style.color = primary.hover}
          onMouseLeave={(e) => e.currentTarget.style.color = primary.base}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Waiting Room Controls */}
      {currentUserId && (
        <WaitingRoomControls 
          hostUserId={currentUserId}
          organizationId={organizationId}
        />
      )}

      {/* Bookings Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => {
          const timeInfo = getTimeUntilMeeting(booking);
          const canJoin = booking.status !== 'cancelled' && 
                         booking.status !== 'no_show' && 
                         booking.status !== 'completed';
          
          const isCancelled = booking.status === 'cancelled';
          const isCompleted = booking.status === 'completed';
          const isInactive = isCancelled || isCompleted;

          // Calculate time until meeting for countdown and urgency colors
          const now = new Date();
          const scheduled = new Date(booking.scheduled_at);
          const diffMs = scheduled.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const showCountdown = diffMins > 0 && diffMins <= 30;
          const isToday = now.toDateString() === scheduled.toDateString();
          
          // Color-coded urgency borders
          let borderColor = 'transparent';
          let backgroundColor = 'rgba(255, 255, 255, 0.5)';
          let borderWidth = '1px';
          
          if (timeInfo.isInProgress && !isInactive) {
            borderColor = '#dc2626'; // red-600 - LIVE
            backgroundColor = '#fee2e2'; // red-50
            borderWidth = '2px';
          } else if (diffMins > 0 && diffMins <= 15 && !isInactive) {
            borderColor = '#16a34a'; // green-600 - SOON
            backgroundColor = '#dcfce7'; // green-50
            borderWidth = '2px';
          } else if (isToday && !isInactive && !timeInfo.isInProgress) {
            borderColor = '#eab308'; // yellow-500 - TODAY
            backgroundColor = '#fef9c3'; // yellow-50
            borderWidth = '2px';
          }

          return (
            <div
              key={booking.id}
              className="relative rounded-lg p-4 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
              style={{
                backgroundColor,
                border: `${borderWidth} solid ${borderColor}`,
                opacity: isInactive ? 0.7 : 1
              }}
            >
              {/* Top Section: Title and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-4 min-w-0">
                  <h3 
                    className={`text-base font-semibold mb-1 truncate ${isInactive ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}
                    title={booking.title}
                  >
                    {booking.title}
                  </h3>

                  {/* Meeting Type Badge */}
                  {booking.meeting_type && (
                    <span 
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                      style={{
                        backgroundColor: `${primary.base}15`,
                        color: primary.base
                      }}
                    >
                      {(booking.meeting_type as any).name}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: isCancelled
                        ? '#fee2e2'
                        : isCompleted
                        ? '#f3f4f6'
                        : timeInfo.isInProgress
                        ? `${primary.base}20`
                        : booking.status === 'waiting'
                        ? '#fef3c7'
                        : '#d1fae5',
                      color: isCancelled
                        ? '#991b1b'
                        : isCompleted
                        ? '#4b5563'
                        : timeInfo.isInProgress
                        ? primary.active
                        : booking.status === 'waiting'
                        ? '#92400e'
                        : '#065f46'
                    }}
                  >
                    {isCancelled && '✕ Cancelled'}
                    {isCompleted && '✓ Completed'}
                    {!isInactive && booking.status === 'waiting' && '⏳ Waiting'}
                    {!isInactive && timeInfo.isInProgress && '● In Progress'}
                    {!isInactive && booking.status === 'confirmed' && '✓ Confirmed'}
                    {!isInactive && booking.status === 'scheduled' && '📅 Scheduled'}
                  </span>
                  
                  {/* Countdown for meetings starting soon */}
                  {showCountdown && !isInactive && !timeInfo.isInProgress && (
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
                </div>
              </div>

              {/* Middle Section: Meeting Details */}
              <div className="space-y-2 mb-3">
                {/* Customer Info */}
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 min-w-0">
                  <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primary.base }} />
                  <span className="font-medium truncate">{booking.customer_name}</span>
                  <span className="mx-2 text-gray-400 flex-shrink-0">•</span>
                  <span className="text-gray-600 dark:text-gray-400 truncate">{booking.customer_email}</span>
                </div>

                {/* Date and Time */}
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primary.base }} />
                  <span className="font-medium">
                    {format(new Date(booking.scheduled_at), 'EEEE, MMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primary.base }} />
                  <span>
                    {format(new Date(booking.scheduled_at), 'h:mm a')} ({booking.duration_minutes} min)
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    {getRelativeTime(booking.scheduled_at)}
                  </span>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-6 line-clamp-2 italic">
                    "{booking.notes}"
                  </p>
                )}
              </div>

              {/* Bottom Section: Action Buttons in Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  {/* In-Progress Pulsing Indicator */}
                  {timeInfo.isInProgress && !isInactive && (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span 
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: primary.base }}
                        ></span>
                        <span 
                          className="relative inline-flex rounded-full h-3 w-3"
                          style={{ backgroundColor: primary.base }}
                        ></span>
                      </span>
                      <span className="text-xs font-semibold" style={{ color: primary.base }}>
                        Live now
                      </span>
                    </div>
                  )}
                  
                  {/* Cancel Button - LEFT SIDE */}
                  {!isInactive && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                  )}
                </div>

                {/* Action Buttons - RIGHT SIDE */}
                <div className="flex gap-2">
                  {canJoin && !isInactive ? (
                    <button
                      onClick={() => handleJoinCall(booking)}
                      onMouseEnter={() => setHoveredButton(booking.id)}
                      onMouseLeave={() => setHoveredButton(null)}
                      disabled={joiningBookingId === booking.id}
                      className={`inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        joiningBookingId === booking.id
                          ? 'bg-gray-400 text-white cursor-wait'
                          : ''
                      }`}
                      style={
                        joiningBookingId === booking.id
                          ? undefined
                          : {
                              background: hoveredButton === booking.id
                                ? `linear-gradient(135deg, ${primary.hover}, ${primary.active})`
                                : `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                              color: 'white',
                              boxShadow: hoveredButton === booking.id ? `0 4px 12px ${primary.base}40` : 'none'
                            }
                      }
                      title="Join as admin (bypass time restrictions)"
                    >
                      {joiningBookingId === booking.id ? (
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
                          Join
                        </>
                      )}
                    </button>
                  ) : isCompleted ? (
                    <span className="text-xs text-gray-400 px-3 py-2">Meeting ended</span>
                  ) : isCancelled ? (
                    <span className="text-xs text-gray-400 px-3 py-2">Cancelled</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Fixed Footer Panel with 3 Action Buttons */}
      <div className="border-t border-white/10 bg-transparent p-4">
        <div className="grid grid-cols-3 gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => {
              setShowPast(false);
              setSelectedStatus('all');
              setLimit(10);
              fetchBookings();
            }}
            onMouseEnter={() => setHoveredActionBtn('refresh')}
            onMouseLeave={() => setHoveredActionBtn(null)}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              backgroundColor: primary.base,
              color: 'white',
              opacity: hoveredActionBtn === 'refresh' ? 0.9 : 1,
            }}
          >
            <ArrowPathIcon className="w-4 h-4 mr-1.5 hidden sm:inline" style={{ color: 'white' }} />
            Refresh
          </button>

          {/* Past Button with Count Badge */}
          <button
            onClick={() => {
              setShowPast(!showPast);
              setLimit(10);
            }}
            onMouseEnter={() => setHoveredActionBtn('past')}
            onMouseLeave={() => setHoveredActionBtn(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative"
            style={{
              backgroundColor: primary.base,
              color: 'white',
              opacity: hoveredActionBtn === 'past' ? 0.9 : 1,
            }}
          >
            <span>{showPast ? <><span className="sm:hidden">Active</span><span className="hidden sm:inline">← Active</span></> : <><span className="sm:hidden">Past</span><span className="hidden sm:inline">Past →</span></>}</span>
            <span 
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white'
              }}
            >
              {showPast ? activeCount : pastCount}
            </span>
          </button>

          {/* More Button */}
          <button
            onClick={() => setLimit(limit + 10)}
            onMouseEnter={() => setHoveredActionBtn('more')}
            onMouseLeave={() => setHoveredActionBtn(null)}
            disabled={bookings.length < limit}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              backgroundColor: bookings.length < limit ? '#e5e7eb' : primary.base,
              color: bookings.length < limit ? '#9ca3af' : 'white',
              cursor: bookings.length < limit ? 'not-allowed' : 'pointer',
              opacity: bookings.length < limit ? 0.5 : hoveredActionBtn === 'more' ? 0.9 : 1,
            }}
          >
            Load More
          </button>
        </div>
      </div>
    </div>
  );
}
