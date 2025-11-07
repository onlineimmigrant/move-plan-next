/**
 * ARIA Live Region Component for Screen Reader Announcements
 * Provides accessible status updates for dynamic content changes
 * 
 * @example
 * ```tsx
 * <AriaLiveRegion
 *   message="Booking created successfully!"
 *   politeness="polite"
 *   clearAfter={3000}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';

export type AriaPoliteness = 'polite' | 'assertive' | 'off';

export interface AriaLiveRegionProps {
  /**
   * Message to announce to screen readers
   */
  message?: string;
  
  /**
   * Politeness level for announcements
   * - 'polite': Wait for user to finish current task (default)
   * - 'assertive': Interrupt immediately
   * - 'off': No announcement
   * 
   * @default 'polite'
   */
  politeness?: AriaPoliteness;
  
  /**
   * Whether the region is visible
   * Set to false to hide visually but keep accessible
   * 
   * @default false
   */
  visible?: boolean;
  
  /**
   * Time in ms to clear message after announcement
   * Set to 0 to never clear
   * 
   * @default 0
   */
  clearAfter?: number;
  
  /**
   * Callback when message is cleared
   */
  onClear?: () => void;
}

/**
 * Component that creates an ARIA live region for screen reader announcements
 * 
 * @remarks
 * Use this component to announce dynamic content changes to screen reader users:
 * - Form validation errors
 * - Booking confirmations
 * - Loading state changes
 * - Success/error messages
 * 
 * The component is visually hidden by default but accessible to screen readers.
 * 
 * @example
 * ```tsx
 * // Announce booking success
 * const [announcement, setAnnouncement] = useState('');
 * 
 * const handleBookingSuccess = () => {
 *   setAnnouncement('Your meeting has been booked successfully');
 * };
 * 
 * return (
 *   <>
 *     <AriaLiveRegion message={announcement} clearAfter={5000} />
 *     <BookingForm onSuccess={handleBookingSuccess} />
 *   </>
 * );
 * ```
 */
export function AriaLiveRegion({
  message,
  politeness = 'polite',
  visible = false,
  clearAfter = 0,
  onClear,
}: AriaLiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
          onClear?.();
        }, clearAfter);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter, onClear]);

  if (!currentMessage) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={visible ? '' : 'sr-only'}
      style={
        visible
          ? undefined
          : {
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: '0',
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: '0',
            }
      }
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook for managing ARIA live region announcements
 * Provides a simple API for announcing messages to screen readers
 * 
 * @example
 * ```tsx
 * const { announce, announcement } = useAriaLiveAnnouncer();
 * 
 * const handleSave = async () => {
 *   try {
 *     await saveBooking();
 *     announce('Booking saved successfully', 'polite');
 *   } catch (error) {
 *     announce('Error saving booking', 'assertive');
 *   }
 * };
 * 
 * return (
 *   <>
 *     <AriaLiveRegion {...announcement} />
 *     <button onClick={handleSave}>Save</button>
 *   </>
 * );
 * ```
 */
export function useAriaLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: AriaPoliteness;
  }>({
    message: '',
    politeness: 'polite',
  });

  /**
   * Announce a message to screen readers
   * 
   * @param message - Message to announce
   * @param politeness - Urgency level ('polite' or 'assertive')
   */
  const announce = (message: string, politeness: AriaPoliteness = 'polite') => {
    setAnnouncement({ message, politeness });
  };

  /**
   * Clear the current announcement
   */
  const clear = () => {
    setAnnouncement({ message: '', politeness: 'polite' });
  };

  return {
    announcement,
    announce,
    clear,
  };
}

export default AriaLiveRegion;
