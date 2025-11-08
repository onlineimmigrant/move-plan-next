import { useCallback } from 'react';
import { useMeetingContext, type Booking } from '@/context/MeetingContext';
import { supabase } from '@/lib/supabase';

interface LaunchVideoCallParams {
  bookingId: string;
  autoUpdateStatus?: boolean;
}

interface QuickLaunchParams {
  meetingTypeId: string;
  participantUserId: string;
  duration?: number; // in minutes
}

export function useMeetingLauncher() {
  const { startVideoCall } = useMeetingContext();

  /**
   * Launch video call from an existing booking
   * Handles waiting room logic for customers
   */
  const launchFromBooking = useCallback(async ({ bookingId, autoUpdateStatus = true }: LaunchVideoCallParams) => {
    try {
      // Get current session token and user
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!session || !user) {
        throw new Error('You must be logged in to join a video call');
      }

      // Get booking details to check if we should enter waiting room
      const bookingResponse = await fetch(`/api/meetings/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });
      
      if (!bookingResponse.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const bookingData = await bookingResponse.json();
      const booking = bookingData.booking || bookingData;

      // Get user profile to check if admin/host
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';
      const isHost = booking.host_user_id === user.id;

      // Check if customer should enter waiting room
      // Customers (non-admin, non-host) enter waiting room unless:
      // 1. Meeting is already in progress (host has approved and started)
      // 2. Booking has been pre-approved (approved_at is set)
      // 3. It's an instant meeting (created within 5 min of scheduled time)
      const now = new Date();
      const startTime = new Date(booking.scheduled_at);
      const createdTime = new Date(booking.created_at);
      const isCustomer = !isAdmin && !isHost;
      const isMeetingInProgress = booking.status === 'in_progress';
      const isPreApproved = booking.approved_at != null;
      const isInstantMeeting = Math.abs((startTime.getTime() - createdTime.getTime()) / 60000) < 5;
      
      // Customer enters waiting room if:
      // 1. They're a customer (not admin or host)
      // 2. Meeting is NOT in progress
      // 3. Meeting has NOT been pre-approved
      // 4. It's NOT an instant meeting
      const shouldEnterWaitingRoom = isCustomer && !isMeetingInProgress && !isPreApproved && !isInstantMeeting;

      console.log('[useMeetingLauncher] Waiting room check:', {
        isAdmin,
        isHost,
        isCustomer,
        now: now.toISOString(),
        startTime: startTime.toISOString(),
        createdTime: createdTime.toISOString(),
        currentStatus: booking.status,
        isMeetingInProgress,
        isPreApproved,
        isInstantMeeting,
        shouldEnterWaitingRoom
      });

      if (shouldEnterWaitingRoom) {
        console.log('[useMeetingLauncher] Entering waiting room...');
        
        // Enter waiting room instead of launching video
        const waitingResponse = await fetch('/api/meetings/waiting-room/enter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ booking_id: bookingId }),
        });

        if (!waitingResponse.ok) {
          const errorText = await waitingResponse.text();
          console.error('[useMeetingLauncher] Failed to enter waiting room:', errorText);
          throw new Error('Failed to enter waiting room');
        }

        const waitingData = await waitingResponse.json();
        console.log('[useMeetingLauncher] Waiting room entered successfully:', waitingData);
        
        // Start video call UI but it will show waiting room
        startVideoCall(waitingData.booking, '', '');
        
        return { success: true, booking: waitingData.booking, waiting: true };
      }

      // Call API to get Twilio credentials and booking details
      const response = await fetch('/api/meetings/launch-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          booking_id: bookingId,
          update_status: autoUpdateStatus 
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to launch video call');
      }

      const { booking: updatedBooking, twilio_token, room_name } = data;

      // Open VideoCallModal with credentials
      startVideoCall(updatedBooking, twilio_token, room_name);

      return { success: true, booking: updatedBooking };
    } catch (error) {
      console.error('Failed to launch video call from booking:', error);
      throw error;
    }
  }, [startVideoCall]);

  /**
   * Quick launch for admin - creates instant meeting
   */
  const launchQuickMeeting = useCallback(async ({ 
    meetingTypeId, 
    participantUserId, 
    duration = 60 
  }: QuickLaunchParams) => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to launch a meeting');
      }

      // Create instant booking and launch
      const response = await fetch('/api/meetings/quick-launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          meeting_type_id: meetingTypeId,
          participant_user_id: participantUserId,
          duration_minutes: duration,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to launch quick meeting');
      }

      const { booking, twilio_token, room_name } = data;

      // Open VideoCallModal
      startVideoCall(booking, twilio_token, room_name);

      return { success: true, booking };
    } catch (error) {
      console.error('Failed to launch quick meeting:', error);
      throw error;
    }
  }, [startVideoCall]);

  /**
   * Check if a booking can be joined
   * - Admins/Hosts: anytime before end
   * - Customers: 15 mins before start OR during meeting (if in_progress)
   */
  const canJoinMeeting = useCallback((booking: Booking, isAdminOrHost: boolean = false): boolean => {
    const now = new Date();
    const startTime = new Date(booking.scheduled_at);
    const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);
    
    // Check valid status
    const isValidStatus = booking.status !== 'cancelled' && booking.status !== 'no_show' && booking.status !== 'completed';
    
    if (!isValidStatus) {
      return false;
    }

    // Meeting already ended
    if (now >= endTime) {
      return false;
    }

    // Admins and hosts can join anytime before end (they can start the meeting)
    if (isAdminOrHost) {
      return true;
    }

    // For customers:
    // 1. Can join if meeting is already in progress (allows rejoining)
    // 2. Can join 15 minutes before scheduled start time (will enter waiting room)
    // 3. Can join if status is 'confirmed' or 'scheduled' within join window (will enter waiting room)
    const fifteenMinsBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
    const isMeetingInProgress = booking.status === 'in_progress';
    const isWithinJoinWindow = now >= fifteenMinsBefore;
    const isConfirmedOrScheduled = booking.status === 'confirmed' || booking.status === 'scheduled';
    
    return isMeetingInProgress || (isWithinJoinWindow && (isConfirmedOrScheduled || booking.status === 'waiting'));
  }, []);

  /**
   * Get time until meeting can be joined
   */
  const getTimeUntilMeeting = useCallback((booking: Booking): { 
    canJoin: boolean;
    timeRemaining?: string;
    isInProgress: boolean;
    isCompleted: boolean;
  } => {
    const now = new Date();
    const startTime = new Date(booking.scheduled_at);
    const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);
    const fifteenMinsBefore = new Date(startTime.getTime() - 15 * 60 * 1000);

    // Meeting already completed
    if (now > endTime) {
      return { canJoin: false, isInProgress: false, isCompleted: true };
    }

    // Meeting in progress
    if (now >= startTime && now < endTime) {
      return { canJoin: true, isInProgress: true, isCompleted: false };
    }

    // Too early (more than 15 mins before start)
    if (now < fifteenMinsBefore) {
      const msRemaining = startTime.getTime() - now.getTime();
      const minsRemaining = Math.floor(msRemaining / 60000);
      const hoursRemaining = Math.floor(minsRemaining / 60);
      
      let timeRemaining = '';
      if (hoursRemaining > 0) {
        timeRemaining = `${hoursRemaining}h ${minsRemaining % 60}m`;
      } else {
        timeRemaining = `${minsRemaining}m`;
      }

      return { 
        canJoin: false, 
        timeRemaining, 
        isInProgress: false, 
        isCompleted: false 
      };
    }

    // Within 15 minutes of start
    const msRemaining = startTime.getTime() - now.getTime();
    const minsRemaining = Math.floor(msRemaining / 60000);
    
    return { 
      canJoin: true, 
      timeRemaining: `Starts in ${minsRemaining}m`, 
      isInProgress: false, 
      isCompleted: false 
    };
  }, []);

  return {
    launchFromBooking,
    launchQuickMeeting,
    canJoinMeeting,
    getTimeUntilMeeting,
  };
}
