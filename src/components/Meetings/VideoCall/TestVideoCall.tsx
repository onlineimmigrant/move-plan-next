'use client';

import React, { useState, useRef } from 'react';
import { VideoCameraIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { VideoCallModal } from '../../modals/MeetingsModals';
import ServiceStatusBanner from './ServiceStatusBanner';

interface TestVideoCallProps {
  bookingId?: string;
}

export default function TestVideoCall({ bookingId }: TestVideoCallProps) {
  const [roomData, setRoomData] = useState<{
    token: string;
    room_name: string;
    room_sid: string;
  } | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testBookingId, setTestBookingId] = useState(bookingId || '');
  
  // Generate a stable identity that persists across component renders
  const userIdentityRef = useRef(`TestUser-${Date.now()}`);

  const createRoom = async () => {
    if (!testBookingId.trim()) {
      setError('Please enter a booking ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meetings/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: testBookingId,
          max_participants: 4,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const data = await response.json();
      console.log('Room created:', data);
      alert('Room created successfully! Now join the room.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!testBookingId.trim()) {
      setError('Please enter a booking ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meetings/rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: testBookingId,
          identity: userIdentityRef.current, // Use stable identity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      const data = await response.json();
      console.log('Joined room:', data);
      setRoomData(data);
      setIsInCall(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const leaveCall = () => {
    setIsInCall(false);
    setRoomData(null);
  };

  if (isInCall && roomData) {
    return (
      <VideoCallModal
        token={roomData.token}
        roomName={roomData.room_name}
        onLeave={leaveCall}
        participantName={userIdentityRef.current}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <VideoCameraIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Test Video Call</h2>
        <p className="text-sm text-gray-600 mt-2">
          Test the Twilio video functionality
        </p>
      </div>

      <ServiceStatusBanner error={error || undefined} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Booking ID
          </label>
          <input
            type="text"
            value={testBookingId}
            onChange={(e) => setTestBookingId(e.target.value)}
            placeholder="Enter booking ID (e.g., from a created booking)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use a booking ID from the database or create one first
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={createRoom}
            disabled={loading || !testBookingId.trim()}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhoneIcon className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Room'}
          </button>

          <button
            onClick={joinRoom}
            disabled={loading || !testBookingId.trim()}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <VideoCameraIcon className="w-4 h-4 mr-2" />
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Testing Steps:</h3>
        <ol className="text-xs text-gray-600 space-y-1">
          <li>1. Create a booking using the booking modal</li>
          <li>2. Copy the booking ID from the database</li>
          <li>3. Enter the booking ID above</li>
          <li>4. Click "Create Room" first</li>
          <li>5. Click "Join Room" to start the video call</li>
          <li>6. Open this page in another tab/window to test multi-participant</li>
        </ol>
      </div>
    </div>
  );
}