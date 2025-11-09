/**
 * ARIA Live Region Component
 * 
 * Provides screen reader announcements for dynamic content updates
 * in the tickets module.
 */

import React, { useEffect, useState } from 'react';

interface AriaLiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // milliseconds
}

/**
 * AriaLiveRegion Component
 * 
 * Announces messages to screen readers for accessibility.
 * Messages automatically clear after a specified duration.
 * 
 * @example
 * ```tsx
 * <AriaLiveRegion
 *   message={announcement}
 *   politeness="polite"
 *   clearAfter={5000}
 * />
 * ```
 */
export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  message,
  politeness = 'polite',
  clearAfter = 5000,
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
};

/**
 * Hook for managing ARIA live announcements
 * 
 * @example
 * ```tsx
 * const { announce, announcement } = useAriaLiveAnnouncer();
 * 
 * const handleSubmit = async () => {
 *   try {
 *     await submitTicket();
 *     announce('Ticket submitted successfully', 'polite');
 *   } catch (error) {
 *     announce('Error submitting ticket', 'assertive');
 *   }
 * };
 * 
 * return (
 *   <>
 *     <AriaLiveRegion {...announcement} />
 *     {/ * Your component * /}
 *   </>
 * );
 * ```
 */
export const useAriaLiveAnnouncer = () => {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: 'polite' | 'assertive';
  }>({
    message: '',
    politeness: 'polite',
  });

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, politeness });
  };

  const clear = () => {
    setAnnouncement({ message: '', politeness: 'polite' });
  };

  return {
    announce,
    clear,
    announcement,
  };
};

export default AriaLiveRegion;
