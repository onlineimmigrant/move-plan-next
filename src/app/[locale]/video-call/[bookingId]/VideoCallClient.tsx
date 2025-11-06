'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import VideoCallModal from '@/components/modals/MeetingsModals/VideoCall/VideoCallModal';

interface VideoCallClientProps {
  booking: any;
  bookingId: string;
}

export default function VideoCallClient({ booking, bookingId }: VideoCallClientProps) {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const router = useRouter();

  // Check if meeting is accessible (15 minutes before start time)
  const canJoinMeeting = () => {
    const meetingTime = new Date(booking.scheduled_at);
    const now = new Date();
    const fifteenMinutesBefore = new Date(meetingTime.getTime() - 15 * 60 * 1000);
    return now >= fifteenMinutesBefore;
  };

  // Get time until meeting is accessible
  const getTimeUntilAccess = () => {
    const meetingTime = new Date(booking.scheduled_at);
    const now = new Date();
    const fifteenMinutesBefore = new Date(meetingTime.getTime() - 15 * 60 * 1000);
    
    if (now >= fifteenMinutesBefore) {
      return null; // Already accessible
    }
    
    const diffMs = fifteenMinutesBefore.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const isAccessible = canJoinMeeting();
  const timeUntilAccess = getTimeUntilAccess();

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const { date, time } = formatDateTime(booking.scheduled_at);

  const handleJoinCall = async () => {
    setIsLoadingToken(true);
    
    try {
      // Generate Twilio token
      const response = await fetch('/api/meetings/video-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `meeting-${bookingId}`,
          identity: booking.customer_email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setShowVideoCall(true);
      } else {
        alert('Failed to join video call. Please try again.');
      }
    } catch (error) {
      console.error('Error getting video token:', error);
      alert('Failed to join video call. Please try again.');
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleLeaveCall = () => {
    setShowVideoCall(false);
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Your Video Appointment</h1>
          <p className="text-blue-100">Join your scheduled meeting</p>
        </div>

        {/* Meeting Details */}
        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ClockIcon className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">When</p>
                <p className="text-gray-600">{date}</p>
                <p className="text-gray-600">{time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserIcon className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Attendee</p>
                <p className="text-gray-600">{booking.customer_name}</p>
                <p className="text-sm text-gray-500">{booking.customer_email}</p>
              </div>
            </div>

            {booking.description && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Description</p>
                  <p className="text-gray-600">{booking.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleJoinCall}
              disabled={!isAccessible || isLoadingToken}
              className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isAccessible && !isLoadingToken
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {isLoadingToken 
                ? 'Connecting...' 
                : isAccessible 
                  ? 'Join Video Call' 
                  : `Available in ${timeUntilAccess}`
              }
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Back to Home
            </button>
          </div>

          {/* Info Note */}
          <div className={`border rounded-lg p-4 text-sm ${
            isAccessible 
              ? 'bg-blue-50 border-blue-200 text-blue-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <p className="font-semibold mb-1">
              {isAccessible ? '✅ Ready to Join' : '⏰ Not Yet Available'}
            </p>
            <p>
              {isAccessible 
                ? 'You can now join the video call. Make sure your camera and microphone are working properly.' 
                : `This meeting will be available 15 minutes before the scheduled time. Please check back in ${timeUntilAccess}.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCall && token && (
        <VideoCallModal
          token={token}
          roomName={`meeting-${bookingId}`}
          onLeave={handleLeaveCall}
          meetingTitle={booking.title || 'Video Appointment'}
          participantName={booking.customer_name}
          userIsHost={false}
        />
      )}
    </div>
  );
}
