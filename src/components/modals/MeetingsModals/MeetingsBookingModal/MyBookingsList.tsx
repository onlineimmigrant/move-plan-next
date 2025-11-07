'use client';

import React, { useEffect, useState } from 'react';
import { VideoCameraIcon, ClockIcon, CalendarIcon, UserIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { type Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Shared/ToastContainer';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MyBookingsListProps {
  organizationId?: string;
}

export default function MyBookingsList({ organizationId }: MyBookingsListProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [joiningBookingId, setJoiningBookingId] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [limit, setLimit] = useState(10);
  const [hoveredActionBtn, setHoveredActionBtn] = useState<string | null>(null);
  
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

  // Get current user's email and role
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        setUserId(user.id);
        
        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    }
    loadUser();
  }, []);

  // Fetch user's bookings
  useEffect(() => {
    if (userEmail) {
      fetchBookings();
    }
  }, [organizationId, userEmail, showPast, limit]);

  const fetchBookings = async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (organizationId) {
        params.append('organization_id', organizationId);
      }
      params.append('customer_email', userEmail); // Filter by current user's email

      const response = await fetch(`/api/meetings/bookings?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `Failed to fetch bookings (${response.status})`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);

      if (!data.success) {
        console.error('API returned success=false:', data);
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      // Smart sorting: prioritize by status and time
      const now = new Date();
      
      // Filter based on showPast
      let filteredBookings = data.bookings || [];
      if (showPast) {
        // Show only past meetings (completed, cancelled, or ended)
        filteredBookings = filteredBookings.filter((booking: Booking) => {
          const endTime = new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000;
          return endTime < now.getTime() || ['completed', 'cancelled'].includes(booking.status);
        });
      } else {
        // Show only upcoming/active meetings
        filteredBookings = filteredBookings.filter((booking: Booking) => {
          const endTime = new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000;
          return endTime >= now.getTime() && !['completed'].includes(booking.status);
        });
      }
      
      const sortedBookings = filteredBookings.sort((a: Booking, b: Booking) => {
        const aTime = new Date(a.scheduled_at).getTime();
        const bTime = new Date(b.scheduled_at).getTime();
        const aEndTime = aTime + a.duration_minutes * 60000;
        const bEndTime = bTime + b.duration_minutes * 60000;
        
        if (showPast) {
          // For past meetings, show most recent first
          return bTime - aTime;
        }
        
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
        return aTime - bTime;
      });

      // Apply limit
      setBookings(sortedBookings.slice(0, limit));
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
    
    // Check if user is admin or host
    const isAdmin = userRole === 'admin';
    const isHost = userId === booking.host_user_id;
    const isAdminOrHost = isAdmin || isHost;
    
    // Check if can join (admins/hosts can join anytime, customers can rejoin during in_progress)
    if (!canJoinMeeting(booking, isAdminOrHost)) {
      if (timeInfo.isCompleted) {
        showError('This meeting has already ended');
      } else if (timeInfo.timeRemaining && !timeInfo.isInProgress) {
        showInfo(`Meeting available in ${timeInfo.timeRemaining}`);
      } else if (booking.status === 'cancelled') {
        showError('This meeting has been cancelled');
      } else {
        showError('Unable to join this meeting');
      }
      return;
    }

    setJoiningBookingId(booking.id);
    showInfo('Joining video call...');
    
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
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'cancelled' 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      showSuccess('Appointment cancelled successfully');
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      showError('Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
          style={{ borderColor: primary.base }}
        ></div>
        <p className="mt-2 text-sm text-gray-600">Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center bg-white/30 backdrop-blur-sm rounded-lg border border-white/20">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No upcoming meetings</p>
        <p className="text-sm text-gray-500 mt-1">Book a meeting to get started</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20 pt-4 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => {
        const timeInfo = getTimeUntilMeeting(booking);
        const isAdmin = userRole === 'admin';
        const isHost = userId === booking.host_user_id;
        const isAdminOrHost = isAdmin || isHost;
        const canJoin = canJoinMeeting(booking, isAdminOrHost);
        const isCancelled = booking.status === 'cancelled';
        const isCompleted = booking.status === 'completed';
        const isInactive = isCancelled || isCompleted;

        // Calculate time until meeting for countdown
        const diffMs = new Date(booking.scheduled_at).getTime() - new Date().getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const showCountdown = diffMins > 0 && diffMins <= 30;

        // Determine border and background based on meeting urgency
        let borderColor = 'transparent';
        let backgroundColor = 'rgba(255, 255, 255, 0.5)';
        let borderWidth = '1px';

        if (!isInactive) {
          if (timeInfo.isInProgress) {
            // Live meeting - Red theme
            borderColor = '#dc2626'; // red-600
            backgroundColor = '#fee2e2'; // red-50
            borderWidth = '2px';
          } else if (diffMins > 0 && diffMins <= 15) {
            // Starting soon (<15 min) - Green theme
            borderColor = '#16a34a'; // green-600
            backgroundColor = '#dcfce7'; // green-50
            borderWidth = '2px';
          } else if (diffMins > 15) {
            // Check if meeting is today
            const meetingDate = new Date(booking.scheduled_at);
            const today = new Date();
            const isToday = meetingDate.toDateString() === today.toDateString();
            
            if (isToday) {
              // Starting today - Yellow theme
              borderColor = '#eab308'; // yellow-500
              backgroundColor = '#fef9c3'; // yellow-50
              borderWidth = '2px';
            }
          }
        }

        return (
          <div
            key={booking.id}
            className="relative rounded-lg px-5 sm:px-5 py-5 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
            style={{
              border: `${borderWidth} solid ${borderColor}`,
              backgroundColor: backgroundColor,
              opacity: isInactive ? 0.7 : 1
            }}
          >
            {/* Top Section: Title and Status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-4">
                <h4 
                  className={`text-base font-semibold mb-1 truncate ${isInactive ? 'line-through text-gray-500' : 'text-gray-900'}`}
                >
                  {booking.title}
                </h4>
                
                {/* Meeting Type Badge */}
                {booking.meeting_type && (
                  <span 
                    className="inline-block px-2 py-0.5 rounded text-xs sm:text-sm font-medium mb-2"
                    style={{
                      backgroundColor: `${primary.base}10`,
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
                      : '#d1fae5',
                    color: isCancelled
                      ? '#991b1b'
                      : isCompleted
                      ? '#4b5563'
                      : timeInfo.isInProgress
                      ? primary.active
                      : '#065f46'
                  }}
                >
                  {isCancelled && '✕ Cancelled'}
                  {isCompleted && '✓ Completed'}
                  {!isInactive && timeInfo.isInProgress && '● In Progress'}
                  {!isInactive && !timeInfo.isInProgress && '✓ Confirmed'}
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
              {/* Date and Time */}
              <div className="flex items-center text-sm text-gray-700">
                <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primary.base }} />
                <span className="font-medium">
                  {format(new Date(booking.scheduled_at), 'EEEE, MMM dd, yyyy')}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primary.base }} />
                <span>
                  {format(new Date(booking.scheduled_at), 'h:mm a')} ({booking.duration_minutes} min)
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600 font-medium">
                  {getRelativeTime(booking.scheduled_at)}
                </span>
              </div>

              {/* Host */}
              <div className="flex items-center text-sm text-gray-400 sm:text-gray-600">
                <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: primary.base }} />
                <span>Host: {(booking as any).host?.full_name || 'Not specified'}</span>
              </div>

              {/* Description/Notes */}
              {booking.notes && (
                <p className="text-sm text-gray-600 mt-2 pl-6 line-clamp-2 italic">
                  "{booking.notes}"
                </p>
              )}
            </div>

            {/* Bottom Section: Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {/* Cancel Button - Left Side */}
              <div>
                {!isInactive && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc262615';
                      e.currentTarget.style.borderColor = '#dc262680';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#dc262640';
                    }}
                    className="inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#dc262640',
                    }}
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                )}
              </div>

              {/* Action Buttons - Right Side */}
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
                        Join Meeting
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
          </div>
        );
      })}
        </div>
      </div>

      {/* Fixed Footer Panel */}
      <div 
        className="absolute bottom-0 left-0 right-0"
      >
        <div className="grid grid-cols-3 gap-2 p-4">
          {/* Refresh Button */}
          <button
            onClick={() => {
              setShowPast(false);
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

          {/* Past Button */}
          <button
            onClick={() => {
              setShowPast(!showPast);
              setLimit(10);
            }}
            onMouseEnter={() => setHoveredActionBtn('past')}
            onMouseLeave={() => setHoveredActionBtn(null)}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              backgroundColor: primary.base,
              color: 'white',
              opacity: hoveredActionBtn === 'past' ? 0.9 : 1,
            }}
          >
            {showPast ? <><span className="sm:hidden">Upcoming</span><span className="hidden sm:inline">← Upcoming</span></> : <><span className="sm:hidden">Past</span><span className="hidden sm:inline">Past →</span></>}
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
