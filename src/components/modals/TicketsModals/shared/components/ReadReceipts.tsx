import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ReadReceiptsProps {
  /**
   * Whether the message has been read
   */
  isRead: boolean;
  
  /**
   * Optional: Custom color for read checkmarks (default: text-cyan-300)
   */
  readColor?: string;
}

/**
 * ReadReceipts Component
 * 
 * Displays read receipt indicators for messages:
 * - Single checkmark: Message sent but not yet read (dimmed)
 * - Double checkmark: Message read by recipient (bright color)
 * 
 * Used in both admin and customer ticket modals to show message read status.
 * Customer modal shows receipts for customer messages (when admin reads).
 * Admin modal shows receipts for admin messages (when customer reads).
 * 
 * @example
 * // Show read receipts for customer's messages
 * {!response.is_admin && (
 *   <ReadReceipts isRead={response.is_read} />
 * )}
 * 
 * @example
 * // Show read receipts for admin's messages
 * {response.is_admin && (
 *   <ReadReceipts isRead={response.is_read} />
 * )}
 */
export default function ReadReceipts({ isRead, readColor = 'text-cyan-300' }: ReadReceiptsProps) {
  if (isRead) {
    // Double checkmark for read messages - bright color
    return (
      <span className="inline-flex items-center ml-1 relative">
        <CheckIcon className={`h-3 w-3 ${readColor}`} />
        <CheckIcon className={`h-3 w-3 ${readColor} -ml-1.5`} />
      </span>
    );
  }
  
  // Single checkmark for sent but not read - dimmed
  return (
    <span className="inline-flex ml-1">
      <CheckIcon className="h-3 w-3 opacity-50" />
    </span>
  );
}
