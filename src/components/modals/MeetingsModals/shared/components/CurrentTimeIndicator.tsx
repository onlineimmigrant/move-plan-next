/**
 * Current Time Indicator Component
 * Displays a red line showing the current time in day/week views
 * 
 * Features:
 * - Updates position every minute
 * - Only visible on today's date
 * - Red line with dot indicator
 * - Positioned absolutely within calendar grid
 * 
 * @example
 * ```tsx
 * <CurrentTimeIndicator
 *   primaryColor="#3B82F6"
 *   isToday={isSameDay(date, new Date())}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface CurrentTimeIndicatorProps {
  /**
   * Primary color (currently unused, keeping for future customization)
   */
  primaryColor: string;
  
  /**
   * Whether the indicator should be shown (only show on today)
   */
  isToday: boolean;
}

/**
 * Component that displays current time as a red line in calendar views
 */
export function CurrentTimeIndicator({ primaryColor, isToday }: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!isToday) return null;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const topPosition = ((hours * 60 + minutes) / (24 * 60)) * 100;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${topPosition}%` }}
      role="presentation"
      aria-label={`Current time: ${format(now, 'h:mm a')}`}
    >
      <div className="relative">
        <div
          className="absolute left-0 w-2 h-2 rounded-full -mt-1"
          style={{ backgroundColor: '#EF4444' }}
        />
        <div
          className="h-0.5 w-full"
          style={{
            backgroundColor: '#EF4444',
            boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)',
          }}
        />
      </div>
    </div>
  );
}

// Helper for formatting (would import from date-fns in actual usage)
function format(date: Date, formatStr: string): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
