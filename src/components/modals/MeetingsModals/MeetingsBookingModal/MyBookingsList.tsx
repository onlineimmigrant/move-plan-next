'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { type Booking } from '@/context/MeetingContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Shared/ToastContainer';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BookingCardSkeleton, BookingCard } from '../shared/components';

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
  const [showPast, setShowPast] = useState(false);
  const [limit, setLimit] = useState(10);
  const [hoveredActionBtn, setHoveredActionBtn] = useState<string | null>(null);
  
  const { 
    launchFromBooking, 
    canJoinMeeting, 
    getTimeUntilMeeting 
  } = useMeetingLauncher();
  
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

  // Ref for virtual scrolling container
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: bookings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card height
    overscan: 3, // Render 3 extra items for smooth scrolling
  });

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
      
      // Auto-complete past meetings
      const allBookings = (data.bookings || []).map((booking: Booking) => {
        const endTime = new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000;
        
        // If meeting has ended and status is not cancelled, mark as completed
        if (endTime < now.getTime() && !['cancelled', 'completed'].includes(booking.status)) {
          return { ...booking, status: 'completed' as const };
        }
        
        return booking;
      });
      
      // Filter based on showPast
      let filteredBookings = allBookings;
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
      <div className="relative min-h-0 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
          <BookingCardSkeleton count={6} />
        </div>
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
      {/* Scrollable Content with Virtual Scrolling */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto pb-20 pt-4 px-4"
      >
        <div 
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const booking = bookings
              .sort((a, b) => {
                // Sort by scheduled_at ascending (nearest first)
                return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
              })[virtualRow.index];
            
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="pb-4">
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    variant="customer"
                    onJoin={handleJoinCall}
                    onCancel={handleCancelBooking}
                    isJoining={joiningBookingId === booking.id}
                    currentUserId={userId || undefined}
                    userRole={userRole || undefined}
                    organizationId={organizationId}
                  />
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

          {/* Active/Inactive Toggle Button */}
          <button
            onClick={() => {
              setShowPast(!showPast);
              setLimit(10);
            }}
            onMouseEnter={() => setHoveredActionBtn('toggle')}
            onMouseLeave={() => setHoveredActionBtn(null)}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              backgroundColor: primary.base,
              color: 'white',
              opacity: hoveredActionBtn === 'toggle' ? 0.9 : 1,
            }}
          >
            {showPast ? 'Active' : 'Inactive'}
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
            More
          </button>
        </div>
      </div>
    </div>
  );
}
