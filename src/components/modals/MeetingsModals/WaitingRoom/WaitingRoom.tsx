'use client';

import React, { useEffect, useState } from 'react';
import { ClockIcon, UserCircleIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';

interface WaitingRoomProps {
  booking: Booking;
  onStatusChange: (status: string) => void;
}

export default function WaitingRoom({ booking, onStatusChange }: WaitingRoomProps) {
  const [waitingTime, setWaitingTime] = useState<string>('');
  const [dots, setDots] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  console.log('[WaitingRoom] Component mounted/rendered', {
    bookingId: booking.id,
    status: booking.status,
    waiting_since: booking.waiting_since
  });

  // Calculate waiting time
  useEffect(() => {
    if (!booking.waiting_since) return;

    const interval = setInterval(() => {
      const start = new Date(booking.waiting_since!);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setWaitingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [booking.waiting_since]);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Handle leaving waiting room
  const handleLeaveWaitingRoom = async () => {
    if (isLeaving) return;
    
    setIsLeaving(true);
    
    try {
      // Update booking back to confirmed status (leave waiting room)
      const response = await fetch('/api/meetings/waiting-room/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[WaitingRoom] Left waiting room successfully');
        // Trigger status change callback to close the modal
        onStatusChange('confirmed');
      } else {
        console.error('[WaitingRoom] Failed to leave waiting room:', data);
        
        // Handle specific error cases
        if (data.error?.includes('completed') || data.error?.includes('cancelled')) {
          // Meeting has ended or been cancelled - just close the modal
          console.log('[WaitingRoom] Meeting has ended, closing modal');
          onStatusChange(data.booking?.status || 'completed');
        } else {
          alert('Failed to leave waiting room. Please try again.');
        }
      }
    } catch (error) {
      console.error('[WaitingRoom] Error leaving waiting room:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  // Poll for status changes
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/meetings/bookings/${booking.id}`);
        if (response.ok) {
          const data = await response.json();
          const updatedBooking = data.booking || data;
          
          if (updatedBooking.status !== 'waiting') {
            onStatusChange(updatedBooking.status);
          }
        }
      } catch (error) {
        console.error('Error checking booking status:', error);
      }
    };

    const interval = setInterval(checkStatus, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [booking.id, onStatusChange]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
          <VideoCameraIcon className="w-12 h-12 text-blue-600" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center border-4 border-white">
          <ClockIcon className="w-5 h-5 text-yellow-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Waiting for Host{dots}
      </h2>

      {/* Subtitle */}
      <p className="text-gray-600 text-center mb-6 max-w-md">
        You're in the waiting room. The host will admit you shortly.
      </p>

      {/* Meeting Details */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6 w-full max-w-md">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <VideoCameraIcon className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <div className="font-medium text-gray-900">{booking.title}</div>
              <div className="text-gray-500">{booking.meeting_type?.name}</div>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <UserCircleIcon className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Host</div>
              <div className="text-gray-500">{booking.customer_name || 'Host'}</div>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Scheduled Time</div>
              <div className="text-gray-500">
                {format(new Date(booking.scheduled_at), 'MMM dd, yyyy h:mm a')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Timer */}
      <div className="flex items-center gap-2 text-gray-600">
        <ClockIcon className="w-5 h-5" />
        <span className="text-sm">Waiting time: <span className="font-mono font-medium">{waitingTime}</span></span>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-md">
        <p className="text-sm text-blue-800 text-center">
          <strong>Tip:</strong> Make sure your camera and microphone are ready.
          The meeting will start automatically once you're admitted.
        </p>
      </div>

      {/* Leave Button */}
      <div className="mt-6">
        <button
          onClick={handleLeaveWaitingRoom}
          disabled={isLeaving}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLeaving ? 'Leaving...' : 'Leave Waiting Room'}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          You can rejoin at any time before the meeting ends
        </p>
      </div>
    </div>
  );
}
