'use client';

import React, { useEffect, useState } from 'react';
import { useMeetingContext } from '@/context/MeetingContext';
import VideoCallModal from './VideoCall/VideoCallModal';
import WaitingRoom from './WaitingRoom/WaitingRoom';
import { supabase } from '@/lib/supabaseClient';

/**
 * Wrapper component that connects VideoCallModal to MeetingContext
 * Renders at root level with z-index 2000 (above all other modals)
 */
export default function ManagedVideoCall() {
  const { 
    videoCallOpen, 
    activeMeeting, 
    twilioToken, 
    twilioRoomName, 
    endVideoCall,
    refreshToken,
    setTwilioToken,
    startVideoCall
  } = useMeetingContext();

  const [userIsHost, setUserIsHost] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  // Compute showWaitingRoom directly from props (no state needed)
  const showWaitingRoom = videoCallOpen && activeMeeting?.status === 'waiting';

  // Check if user is host or admin
  useEffect(() => {
    async function checkUserRole() {
      if (!activeMeeting) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserIsAdmin(profile?.role === 'admin');
      setUserIsHost(activeMeeting.host_user_id === user.id);
    }
    
    checkUserRole();
  }, [activeMeeting]);

  // Set up token refresh timer (50 minutes - before 1 hour expiry)
  useEffect(() => {
    if (!videoCallOpen || !activeMeeting || !twilioToken) return;

    const refreshTimer = setTimeout(async () => {
      console.log('🔄 Refreshing Twilio token...');
      try {
        const newToken = await refreshToken(activeMeeting.id);
        if (newToken) {
          console.log('✅ Token refreshed successfully');
        } else {
          console.error('❌ Failed to refresh token');
        }
      } catch (error) {
        console.error('❌ Error refreshing token:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearTimeout(refreshTimer);
  }, [videoCallOpen, activeMeeting, twilioToken, refreshToken]);

  // Don't render if not open
  if (!videoCallOpen || !activeMeeting) {
    return null;
  }

  console.log('[ManagedVideoCall] Main render:', {
    status: activeMeeting.status,
    showWaitingRoom,
    hasToken: !!twilioToken,
    hasRoom: !!twilioRoomName
  });

  // Handle status change from waiting room
  const handleStatusChange = async (newStatus: string) => {
    console.log('[ManagedVideoCall] handleStatusChange called with:', newStatus);
    
    if (newStatus === 'in_progress') {
      console.log('[ManagedVideoCall] Status changed to in_progress, fetching Twilio token...');
      
      // Fetch Twilio token now that we're approved
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !activeMeeting) {
          console.error('[ManagedVideoCall] No session or active meeting');
          return;
        }

        const response = await fetch('/api/meetings/launch-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            booking_id: activeMeeting.id,
            update_status: false // Don't update status, already in_progress
          }),
        });

        const data = await response.json();

        console.log('[ManagedVideoCall] API response:', {
          success: data.success,
          hasToken: !!data.token,
          hasRoomName: !!data.room_name,
          error: data.error
        });

        if (data.success && data.token && data.room_name) {
          console.log('[ManagedVideoCall] ✅ Token received, starting video call');
          // Update the booking in context with the new status and credentials
          // showWaitingRoom will automatically become false because status changes from 'waiting' to 'in_progress'
          startVideoCall(
            { ...activeMeeting, status: 'in_progress' },
            data.token,
            data.room_name
          );
        } else {
          console.error('[ManagedVideoCall] ❌ Failed to get token:', data.error || 'Unknown error');
          console.error('[ManagedVideoCall] Response data:', data);
        }
      } catch (error) {
        console.error('[ManagedVideoCall] Error fetching token:', error);
      }
    } else if (newStatus === 'cancelled') {
      console.log('[ManagedVideoCall] Meeting was rejected/cancelled');
      endVideoCall();
    } else if (newStatus === 'confirmed' || newStatus === 'scheduled') {
      // User left the waiting room - close the modal
      console.log('[ManagedVideoCall] User left waiting room, closing modal');
      endVideoCall();
    } else if (newStatus === 'completed') {
      // Meeting ended or was completed
      console.log('[ManagedVideoCall] Meeting completed, closing modal');
      endVideoCall();
    }
  };

  // Show waiting room if status is waiting
  if (showWaitingRoom) {
    console.log('[ManagedVideoCall] ✅✅✅ RENDERING WAITING ROOM COMPONENT ✅✅✅');
    return (
      <div
        className="fixed inset-0 z-[99999]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <WaitingRoom 
          booking={activeMeeting}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  console.log('[ManagedVideoCall] ❌ showWaitingRoom is FALSE - checking for token/room');

  // Don't render video call if missing token data (but allow waiting room above)
  if (!twilioToken || !twilioRoomName) {
    console.log('[ManagedVideoCall] ❌ Missing token/room - returning null');
    return null;
  }

  console.log('[ManagedVideoCall] ✅ Has token/room - rendering VideoCallModal');

  const handleLeave = async () => {
    // Don't mark as completed or end video call
    // This allows users to rejoin during the meeting time
    // The meeting will auto-complete after scheduled end time
    console.log('👋 User left video call but can rejoin');
    
    // Just close the modal, but keep meeting active in context
    // User can click "Join Meeting" again to rejoin
    endVideoCall();
  };

  return (
    <div
      className="fixed inset-0 z-[10003]"
      style={{
        pointerEvents: videoCallOpen ? 'auto' : 'none',
      }}
    >
      <VideoCallModal
        token={twilioToken}
        roomName={twilioRoomName}
        onLeave={handleLeave}
        participantName={undefined} // Will be determined from token
        meetingTitle={activeMeeting?.title}
        userIsHost={userIsHost || userIsAdmin}
      />
    </div>
  );
}
