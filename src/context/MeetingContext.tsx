'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Booking type - matching actual database schema
export interface Booking {
  id: string;
  organization_id: string;
  meeting_type_id: string;
  host_user_id: string;
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  title: string;
  description?: string;
  scheduled_at: string; // TIMESTAMP - when meeting is scheduled
  duration_minutes: number;
  timezone: string;
  status: 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_room_id?: string;
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  // Waiting room fields
  waiting_since?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  // Tracking
  viewed_by?: string[]; // Array of user IDs who have viewed this meeting
  created_at: string;
  updated_at: string;
  meeting_type?: {
    id: string;
    name: string;
    duration_minutes: number;
    [key: string]: any;
  };
}

interface MeetingContextType {
  // Current meeting state
  activeMeeting: Booking | null;
  videoCallOpen: boolean;
  bookingModalOpen: boolean;
  adminModalOpen: boolean;
  
  // Twilio credentials
  twilioToken: string | null;
  twilioRoomName: string | null;
  
  // Actions
  startVideoCall: (booking: Booking, token: string, roomName: string) => void;
  endVideoCall: () => void;
  openBookingModal: () => void;
  closeBookingModal: () => void;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  
  // Token management
  setTwilioToken: (token: string) => void;
  refreshToken: (bookingId: string) => Promise<string | null>;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

interface MeetingProviderProps {
  children: ReactNode;
}

export function MeetingProvider({ children }: MeetingProviderProps) {
  const [activeMeeting, setActiveMeeting] = useState<Booking | null>(null);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [twilioToken, setTwilioToken] = useState<string | null>(null);
  const [twilioRoomName, setTwilioRoomName] = useState<string | null>(null);

  const startVideoCall = useCallback((booking: Booking, token: string, roomName: string) => {
    setActiveMeeting(booking);
    setTwilioToken(token);
    setTwilioRoomName(roomName);
    setVideoCallOpen(true);
    
    // Hide other modals when video call opens
    setBookingModalOpen(false);
    setAdminModalOpen(false);
  }, []);

  const endVideoCall = useCallback(() => {
    setVideoCallOpen(false);
    setActiveMeeting(null);
    setTwilioToken(null);
    setTwilioRoomName(null);
  }, []);

  const openBookingModal = useCallback(() => {
    setBookingModalOpen(true);
    // Don't close video call - it stays open in background
  }, []);

  const closeBookingModal = useCallback(() => {
    setBookingModalOpen(false);
  }, []);

  const openAdminModal = useCallback(() => {
    setAdminModalOpen(true);
  }, []);

  const closeAdminModal = useCallback(() => {
    setAdminModalOpen(false);
  }, []);

  const refreshToken = useCallback(async (bookingId: string): Promise<string | null> => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found for token refresh');
        return null;
      }

      const response = await fetch('/api/meetings/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setTwilioToken(data.token);
        return data.token;
      }

      return null;
    } catch (error) {
      console.error('Failed to refresh Twilio token:', error);
      return null;
    }
  }, []);

  const value: MeetingContextType = {
    activeMeeting,
    videoCallOpen,
    bookingModalOpen,
    adminModalOpen,
    twilioToken,
    twilioRoomName,
    startVideoCall,
    endVideoCall,
    openBookingModal,
    closeBookingModal,
    openAdminModal,
    closeAdminModal,
    setTwilioToken,
    refreshToken,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeetingContext() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeetingContext must be used within a MeetingProvider');
  }
  return context;
}

export type { MeetingContextType };
