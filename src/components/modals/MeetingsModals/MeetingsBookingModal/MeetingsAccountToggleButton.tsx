'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import MeetingsBookingModal from './MeetingsBookingModal';

/**
 * MeetingsAccountToggleButton
 * 
 * Customer-facing toggle button for booking meetings.
 * Automatically hidden on /admin routes (admins use MeetingsAdminToggleButton instead).
 * 
 * Features:
 * - Fixed position floating button
 * - Auto-hidden on admin pages
 * - Opens MeetingsBookingModal
 */
export default function MeetingsAccountToggleButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide on admin routes - admins use MeetingsAdminToggleButton instead
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-36 w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center z-[9998] group"
        aria-label="Schedule Meeting"
      >
        <VideoCameraIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
      </button>

      <MeetingsBookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}