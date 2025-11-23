/**
 * LiveRegion Component
 * 
 * ARIA live region for screen reader announcements
 */

'use client';

import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
}

export function LiveRegion({ message }: LiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear message after 5 seconds
    if (message) {
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by parent component
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
