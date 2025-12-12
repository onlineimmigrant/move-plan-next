'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { type Booking } from '@/context/MeetingContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Shared/ToastContainer';
import WaitingRoomControls from '../WaitingRoom/WaitingRoomControls';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BookingCardSkeleton, BookingCard } from '../shared/components';

interface AdminBookingsListProps {
  organizationId?: string;
  onInviteClick?: () => void;
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

  // Ref for virtual scrolling container
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: bookings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card height
    overscan: 3, // Render 3 extra items for smooth scrolling
  });

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
  const fetchBookings = useCallback(async () => {
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
      
      // Auto-complete past meetings
      const allBookings = data.bookings.map((booking: Booking) => {
        const endTime = new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000;
        
        // If meeting has ended and status is not cancelled, mark as completed
        if (endTime < now.getTime() && !['cancelled', 'completed'].includes(booking.status)) {
          return { ...booking, status: 'completed' as const };
        }
        
        return booking;
      });
      
      // Calculate counts
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
  }, [selectedStatus, showPast, limit, showError, showSuccess, showInfo]);

  // Call fetchBookings when dependencies change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleJoinCall = useCallback(async (booking: Booking) => {
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
  }, [launchFromBooking, showError, showInfo, showSuccess]);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
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
  }, [fetchBookings, showSuccess, showError]);

  // Memoized computed values
  const canLoadMore = useMemo(() => {
    return bookings.length >= limit;
  }, [bookings.length, limit]);

  // Memoized hover handlers
  const handleRefreshHover = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.color = primary.hover;
  }, [primary.hover]);

  const handleRefreshLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.color = primary.base;
  }, [primary.base]);

  const handleActionBtnEnter = useCallback((btn: string) => () => {
    setHoveredActionBtn(btn);
  }, []);

  const handleActionBtnLeave = useCallback(() => {
    setHoveredActionBtn(null);
  }, []);

  const handleRefreshClick = useCallback(() => {
    setShowPast(false);
    setSelectedStatus('all');
    setLimit(10);
    fetchBookings();
  }, [fetchBookings]);

  const handleTogglePast = useCallback(() => {
    setShowPast(!showPast);
    setLimit(10);
  }, [showPast]);

  const handleLoadMore = useCallback(() => {
    setLimit(limit + 10);
  }, [limit]);

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
          onMouseEnter={handleRefreshHover}
          onMouseLeave={handleRefreshLeave}
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
          onMouseEnter={handleRefreshHover}
          onMouseLeave={handleRefreshLeave}
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

      {/* Bookings Grid - Scrollable with Virtual Scrolling */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-4 min-h-0" 
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div 
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const booking = bookings[virtualRow.index];
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
                    variant="admin"
                    onJoin={handleJoinCall}
                    onCancel={handleCancelBooking}
                    isJoining={joiningBookingId === booking.id}
                    currentUserId={currentUserId || undefined}
                    userRole="admin"
                    organizationId={organizationId}
                  />
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
            onClick={handleRefreshClick}
            onMouseEnter={handleActionBtnEnter('refresh')}
            onMouseLeave={handleActionBtnLeave}
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

          {/* Active/Inactive Toggle Button with Count Badge */}
          <button
            onClick={handleTogglePast}
            onMouseEnter={handleActionBtnEnter('toggle')}
            onMouseLeave={handleActionBtnLeave}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative"
            style={{
              backgroundColor: primary.base,
              color: 'white',
              opacity: hoveredActionBtn === 'toggle' ? 0.9 : 1,
            }}
          >
            <span>{showPast ? 'Active' : 'Inactive'}</span>
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
            onClick={handleLoadMore}
            onMouseEnter={handleActionBtnEnter('more')}
            onMouseLeave={handleActionBtnLeave}
            disabled={!canLoadMore}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              backgroundColor: !canLoadMore ? '#e5e7eb' : primary.base,
              color: !canLoadMore ? '#9ca3af' : 'white',
              cursor: !canLoadMore ? 'not-allowed' : 'pointer',
              opacity: !canLoadMore ? 0.5 : hoveredActionBtn === 'more' ? 0.9 : 1,
            }}
          >
            More
          </button>
        </div>
      </div>
    </div>
  );
}
