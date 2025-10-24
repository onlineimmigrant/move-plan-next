'use client';

import React, { useEffect, useState } from 'react';
import { VideoCameraIcon, ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { type Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Shared/ToastContainer';

interface MyBookingsListProps {
  organizationId?: string;
}

export default function MyBookingsList({ organizationId }: MyBookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [joiningBookingId, setJoiningBookingId] = useState<string | null>(null);
  
  const { 
    launchFromBooking, 
    canJoinMeeting, 
    getTimeUntilMeeting 
  } = useMeetingLauncher();
  
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

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
  }, [organizationId, userEmail]);

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

      // Filter to only show upcoming and in-progress meetings (not past completed ones)
      const now = new Date();
      const activeBookings = (data.bookings || []).filter((booking: Booking) => {
        const scheduledTime = new Date(booking.scheduled_at);
        const endTime = new Date(scheduledTime.getTime() + booking.duration_minutes * 60000);
        return endTime > now || booking.status === 'in_progress';
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

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No upcoming meetings</p>
        <p className="text-sm text-gray-500 mt-1">Book a meeting to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">My Upcoming Meetings</h3>
      
      {bookings.map((booking) => {
        const timeInfo = getTimeUntilMeeting(booking);
        const isAdmin = userRole === 'admin';
        const isHost = userId === booking.host_user_id;
        const isAdminOrHost = isAdmin || isHost;
        const canJoin = canJoinMeeting(booking, isAdminOrHost);

        return (
          <div
            key={booking.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Meeting Title */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {booking.title}
                </h4>

                {/* Host Name */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>Host: {(booking as any).host?.full_name || 'Not specified'}</span>
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
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
                  </span>

                  {/* Time until meeting */}
                  {timeInfo.timeRemaining && !timeInfo.isInProgress && (
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

              {/* Join Button */}
              <div className="ml-4">
                {canJoin ? (
                  <button
                    onClick={() => handleJoinCall(booking)}
                    disabled={joiningBookingId === booking.id}
                    className={`inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      joiningBookingId === booking.id
                        ? 'bg-gray-400 text-white cursor-wait'
                        : timeInfo.isInProgress
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {joiningBookingId === booking.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      <>
                        <VideoCameraIcon className="w-5 h-5 mr-2" />
                        {timeInfo.isInProgress ? 'Rejoin Call' : 'Join Video Call'}
                      </>
                    )}
                  </button>
                ) : timeInfo.isCompleted ? (
                  <span className="text-sm text-gray-400">Meeting ended</span>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Not yet available
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

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
