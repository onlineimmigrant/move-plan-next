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
  PlusIcon
} from '@heroicons/react/24/outline';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { type Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Shared/ToastContainer';
import WaitingRoomControls from '../WaitingRoom/WaitingRoomControls';
import InstantMeetingModal from '../InstantMeetingModal';

interface AdminBookingsListProps {
  organizationId?: string;
}

export default function AdminBookingsList({ organizationId }: AdminBookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningBookingId, setJoiningBookingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showInstantMeetingModal, setShowInstantMeetingModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { 
    launchFromBooking, 
    canJoinMeeting, 
    getTimeUntilMeeting 
  } = useMeetingLauncher();
  
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

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
  }, [selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication session');
      }

      // Build query params
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/meetings/bookings?${params.toString()}`, {
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

      // Filter for future and current meetings
      const now = new Date();
      const activeBookings = data.bookings.filter((booking: Booking) => {
        const endTime = new Date(new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000);
        return endTime >= now;
      });

      // Sort by scheduled_at (upcoming first)
      const sortedBookings = activeBookings.sort((a: Booking, b: Booking) => {
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
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
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-gray-600">Loading bookings...</p>
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
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
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
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Waiting Room Controls */}
      {currentUserId && (
        <WaitingRoomControls 
          hostUserId={currentUserId}
          organizationId={organizationId}
        />
      )}

      {/* Header with Filter Controls and Instant Meeting Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="waiting">Waiting</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Instant Meeting Button */}
          <button
            onClick={() => setShowInstantMeetingModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Send Instant Invite
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          <UsersIcon className="inline w-4 h-4 mr-1" />
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
        </div>
      </div>

      {/* Instant Meeting Modal */}
      <InstantMeetingModal
        isOpen={showInstantMeetingModal}
        onClose={() => setShowInstantMeetingModal(false)}
        onSuccess={() => {
          fetchBookings(); // Refresh list after creating instant meeting
        }}
      />

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.map((booking) => {
          const timeInfo = getTimeUntilMeeting(booking);
          const canJoin = booking.status !== 'cancelled' && 
                         booking.status !== 'no_show' && 
                         booking.status !== 'completed';

          return (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-white"
            >
              <div className="flex items-start justify-between">
                {/* Meeting Info */}
                <div className="flex-1">
                  {/* Meeting Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {booking.title}
                  </h3>

                  {/* Customer Info - Name and Email */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <UserIcon className="w-4 h-4 mr-2" />
                    <span className="font-medium">{booking.customer_name}</span>
                    <span className="ml-2 text-gray-500">({booking.customer_email})</span>
                  </div>

                  {/* Meeting Time */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {format(new Date(booking.scheduled_at), 'MMM dd, yyyy')}
                    </span>
                    <ClockIcon className="w-4 h-4 ml-4 mr-2" />
                    <span>
                      {format(new Date(booking.scheduled_at), 'h:mm a')} ({booking.duration_minutes} min)
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' || booking.status === 'scheduled'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {booking.status.replace('_', ' ')}
                    </span>

                    {/* Time until meeting */}
                    {timeInfo.timeRemaining && !timeInfo.isInProgress && !timeInfo.isCompleted && (
                      <span className="text-xs text-gray-500">{timeInfo.timeRemaining}</span>
                    )}
                    {timeInfo.isInProgress && (
                      <span className="text-xs text-blue-600 font-medium">● Meeting in progress</span>
                    )}
                  </div>

                  {/* Notes (if any) */}
                  {booking.notes && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{booking.notes}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="ml-4 flex flex-col gap-2">
                  {canJoin && (
                    <button
                      onClick={() => handleJoinCall(booking)}
                      disabled={joiningBookingId === booking.id}
                      className={`inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        joiningBookingId === booking.id
                          ? 'bg-gray-400 text-white cursor-wait'
                          : timeInfo.isInProgress
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
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
                          {timeInfo.isInProgress ? 'Join' : 'Join Early'}
                        </>
                      )}
                    </button>
                  )}
                  
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchBookings}
        className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Refresh bookings
      </button>
    </div>
  );
}
