'use client';

import React, { useEffect, useState } from 'react';
import { 
  UserCircleIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Booking } from '@/context/MeetingContext';
import { format } from 'date-fns';
import { useToast } from '@/components/Shared/ToastContainer';

interface WaitingRoomControlsProps {
  hostUserId: string;
  organizationId?: string;
}

export default function WaitingRoomControls({ hostUserId, organizationId }: WaitingRoomControlsProps) {
  const [waitingParticipants, setWaitingParticipants] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // Fetch waiting participants
  const fetchWaitingParticipants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (organizationId) {
        params.append('organization_id', organizationId);
      } else {
        params.append('host_user_id', hostUserId);
      }

      console.log('[WaitingRoomControls] Fetching waiting participants with params:', { 
        hostUserId, 
        organizationId,
        url: `/api/meetings/waiting-room/enter?${params.toString()}`
      });

      const response = await fetch(`/api/meetings/waiting-room/enter?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch waiting participants');
      }

      const data = await response.json();
      
      console.log('[WaitingRoomControls] Received waiting participants:', {
        count: data.waiting_participants?.length || 0,
        participants: data.waiting_participants
      });
      
      setWaitingParticipants(data.waiting_participants || []);
    } catch (err) {
      console.error('Error fetching waiting participants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates
  useEffect(() => {
    fetchWaitingParticipants();
    const interval = setInterval(fetchWaitingParticipants, 5000);
    return () => clearInterval(interval);
  }, [hostUserId, organizationId]);

  const handleApprove = async (bookingId: string) => {
    setProcessingId(bookingId);
    
    try {
      const response = await fetch('/api/meetings/waiting-room/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          host_user_id: hostUserId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Approve API error:', data);
        
        // Provide user-friendly error messages
        if (data.error && data.error.includes('status is')) {
          // Extract the status from error message
          const statusMatch = data.error.match(/status is (\w+)/);
          const currentStatus = statusMatch ? statusMatch[1] : 'unknown';
          
          if (currentStatus === 'confirmed' || currentStatus === 'scheduled') {
            showError('Customer has not joined yet. They need to click "Join Meeting" first.');
          } else if (currentStatus === 'in_progress') {
            showError('This participant has already been approved and is in the meeting.');
          } else {
            showError(`Cannot approve: meeting is ${currentStatus}`);
          }
        } else {
          throw new Error(data.error || 'Failed to approve participant');
        }
        return;
      }

      success('Participant approved');
      fetchWaitingParticipants();
    } catch (err) {
      console.error('Error approving participant:', err);
      showError('Failed to approve participant');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt('Rejection reason (optional):');
    
    setProcessingId(bookingId);
    
    try {
      const response = await fetch('/api/meetings/waiting-room/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          host_user_id: hostUserId,
          rejection_reason: reason || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject participant');
      }

      success('Participant rejected');
      fetchWaitingParticipants();
    } catch (err) {
      console.error('Error rejecting participant:', err);
      showError('Failed to reject participant');
    } finally {
      setProcessingId(null);
    }
  };

  const getWaitingTime = (waitingSince?: string) => {
    if (!waitingSince) return '';
    
    const start = new Date(waitingSince);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes === 0) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  if (waitingParticipants.length === 0) {
    return null; // Don't show if no one waiting
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <UserCircleIcon className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-3">
            Waiting Room ({waitingParticipants.length})
          </h3>
          
          <div className="space-y-2">
            {waitingParticipants.map((participant) => (
              <div
                key={participant.id}
                className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {participant.customer_name || participant.customer_email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {participant.title} • {getWaitingTime(participant.waiting_since)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(participant.id)}
                    disabled={processingId === participant.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Admit
                  </button>
                  
                  <button
                    onClick={() => handleReject(participant.id)}
                    disabled={processingId === participant.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
