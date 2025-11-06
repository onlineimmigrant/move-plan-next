// EventDetailsModal - Display and manage calendar event details
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface EventDetails {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  status: 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  meeting_type?: {
    id: string;
    name: string;
    color?: string;
    duration_minutes: number;
  };
  created_at: string;
  updated_at: string;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetails | null;
  onEdit?: (event: EventDetails) => void;
  onCancel?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onStatusChange?: (eventId: string, status: EventDetails['status']) => void;
  isAdmin?: boolean;
  use24Hour?: boolean; // Time format preference from settings
}

const statusConfig = {
  confirmed: { label: 'Confirmed', bgColor: () => '#d1fae5', textColor: () => '#065f46', icon: CheckIcon },
  waiting: { label: 'Waiting', bgColor: () => '#fef3c7', textColor: () => '#92400e', icon: ClockIcon },
  in_progress: { label: 'In Progress', bgColor: () => '#e9d5ff', textColor: () => '#581c87', icon: ClockIcon },
  completed: { label: 'Completed', bgColor: () => '#ccfbf1', textColor: () => '#115e59', icon: CheckIcon },
  cancelled: { label: 'Cancelled', bgColor: () => '#fee2e2', textColor: () => '#991b1b', icon: XMarkIcon },
};

/**
 * EventDetailsModal
 * 
 * Displays detailed information about a calendar event/booking.
 * Allows admins to:
 * - View full event details
 * - Edit event information
 * - Change event status
 * - Cancel/delete events
 * - Contact customer
 * 
 * @example
 * ```tsx
 * <EventDetailsModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   event={selectedEvent}
 *   isAdmin={true}
 *   onEdit={handleEdit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onCancel,
  onDelete,
  onStatusChange,
  isAdmin = false,
  use24Hour = true, // Default to 24-hour format
}: EventDetailsModalProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstFocusable = firstFocusableRef.current;
      const lastFocusable = lastFocusableRef.current;

      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    const timer = setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!event) return null;

  const startDate = new Date(event.scheduled_at);
  const endDate = new Date(startDate.getTime() + event.duration_minutes * 60000);
  const now = new Date();
  
  // Check if event is in the past (end time has passed)
  const isEventInPast = endDate < now;

  // Safely get status config with fallback to confirmed
  const currentStatusConfig = statusConfig[event.status] || statusConfig.confirmed;
  const StatusIcon = currentStatusConfig.icon;

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    if (onCancel) {
      onCancel(event.id);
    }
    setShowCancelConfirm(false);
    onClose();
  };

  const handleStatusChange = (newStatus: EventDetails['status']) => {
    if (onStatusChange) {
      onStatusChange(event.id, newStatus);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event);
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm('⚠️ Are you sure you want to PERMANENTLY DELETE this booking?\n\nThis will completely remove it from the system and cannot be undone.\n\nIf you want to keep a record, use "Cancel Event" instead.')) {
      if (onDelete) {
        onDelete(event.id);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10002] p-4 animate-in fade-in duration-200"
        onClick={onClose}
        role="presentation"
      >
        {/* Modal Container */}
        <div 
          ref={modalRef}
          className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
          role="dialog"
          aria-labelledby="event-details-modal-title"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" style={{ color: primary.base }} />
                <h2 
                  id="event-details-modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  {event.title || 'Event Details'}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {format(startDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close modal (Esc)"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 bg-white/20 dark:bg-gray-900/20 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Status Badges - Show only final status for past events, all statuses for future/current */}
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {/* Current Status - Highlighted */}
                  <div 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm text-xs font-medium"
                    style={{
                      backgroundColor: currentStatusConfig.bgColor(),
                      color: currentStatusConfig.textColor()
                    }}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{currentStatusConfig.label}</span>
                  </div>

                  {/* Other Statuses - Only show for future/current events and if admin */}
                  {!isEventInPast && isAdmin && Object.keys(statusConfig).filter(s => s !== event.status).map((statusKey) => {
                    const status = statusKey as EventDetails['status'];
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm text-xs font-medium bg-gray-100/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-600/60 transition-all border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meeting Type - Text with color circle */}
              {event.meeting_type && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Meeting Type</p>
                  <div className="flex items-center gap-2">
                    {event.meeting_type.color && (
                      <div
                        className="w-3 h-3 rounded-full ring-2 ring-white/50 dark:ring-gray-900/50"
                        style={{ backgroundColor: event.meeting_type.color }}
                      />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{event.meeting_type.name}</span>
                  </div>
                </div>
              )}

        {/* Time & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <ClockIcon className="w-5 h-5 mt-0.5" style={{ color: primary.base }} />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</p>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                {format(startDate, use24Hour ? 'HH:mm' : 'h:mm a')} - {format(endDate, use24Hour ? 'HH:mm' : 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ClockIcon className="w-5 h-5 mt-0.5" style={{ color: primary.base }} />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</p>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                {event.duration_minutes} minutes
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5" style={{ color: primary.base }} />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{event.customer_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5" style={{ color: primary.base }} />
              <a
                href={`mailto:${event.customer_email}`}
                className="text-sm hover:underline"
                style={{ color: primary.base }}
                onMouseEnter={(e) => e.currentTarget.style.color = primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.color = primary.base}
              >
                {event.customer_email}
              </a>
            </div>

            {event.customer_phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5" style={{ color: primary.base }} />
                <a
                  href={`tel:${event.customer_phone}`}
                  className="text-sm hover:underline"
                  style={{ color: primary.base }}
                  onMouseEnter={(e) => e.currentTarget.style.color = primary.hover}
                  onMouseLeave={(e) => e.currentTarget.style.color = primary.base}
                >
                  {event.customer_phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {event.notes && (
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
            <div className="flex items-start gap-3">
              <ChatBubbleLeftIcon className="w-5 h-5 mt-0.5" style={{ color: primary.base }} />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && onDelete && isEventInPast && (
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
            {/* Delete Button - Visible for all past events (completed or cancelled) */}
            <div className="flex justify-end">
              <button
                ref={lastFocusableRef}
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 backdrop-blur-sm rounded-lg transition-all min-h-[44px]"
                title="Permanently remove this past booking"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete Booking</span>
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Created: {format(new Date(event.created_at), use24Hour ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy h:mm a')}</p>
          {event.updated_at !== event.created_at && (
            <p className="mt-1">Updated: {format(new Date(event.updated_at), use24Hour ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy h:mm a')}</p>
          )}
        </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10003] p-4">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cancel Event?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this event? The customer will be notified.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-lg transition-all"
              >
                Keep Event
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 backdrop-blur-sm rounded-lg transition-all"
              >
                Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
