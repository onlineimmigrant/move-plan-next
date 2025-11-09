'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import MeetingsBookingModal from './MeetingsBookingModal';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * MeetingsAccountToggleButton
 * 
 * Customer-facing toggle button for booking meetings.
 * Automatically hidden on /admin routes (admins use MeetingsAdminToggleButton instead).
 * Only visible to authenticated users.
 * 
 * Features:
 * - Fixed position floating button
 * - Auto-hidden on admin pages
 * - Auto-hidden for non-authenticated users
 * - Opens MeetingsBookingModal
 * - Handles ?openMeeting={bookingId} query parameter for direct links
 */
export default function MeetingsAccountToggleButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { launchFromBooking } = useMeetingLauncher();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle direct meeting link from email (e.g., ?openMeeting=booking-id)
  useEffect(() => {
    const openMeetingId = searchParams.get('openMeeting');
    
    if (openMeetingId) {
      console.log('[MeetingsAccountToggleButton] Auto-joining meeting from link:', openMeetingId);
      
      // Auto-launch the meeting
      launchFromBooking({ bookingId: openMeetingId })
        .then(() => {
          console.log('[MeetingsAccountToggleButton] Meeting launched successfully');
        })
        .catch((error) => {
          console.error('[MeetingsAccountToggleButton] Failed to launch meeting:', error);
          // Fall back to opening the modal so user can see their bookings
          setIsOpen(true);
        });
      
      // Clean up URL (remove query param)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('openMeeting');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, launchFromBooking]);

  // Hide on admin routes - admins use MeetingsAdminToggleButton instead
  // Hide on account routes - account page has integrated modal button
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/account')) {
    return null;
  }

  // Hide for non-authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-36 w-14 h-14 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center z-[9998] group"
        style={{ 
          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover}, ${primary.active})` 
        }}
        aria-label="Schedule Appointment"
      >
        <VideoCameraIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
      </button>

      <MeetingsBookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}