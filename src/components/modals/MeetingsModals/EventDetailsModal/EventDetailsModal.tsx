// EventDetailsModal - Display and manage calendar event details
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface EventDetails {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  status: 'scheduled' | 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed' | 'no_show';
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
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: CalendarIcon },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckIcon },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: ClockIcon },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XMarkIcon },
  completed: { label: 'Completed', color: 'bg-teal-100 text-teal-800', icon: CheckIcon },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-800', icon: XMarkIcon },
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
}: EventDetailsModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!event) return null;

  const startDate = new Date(event.scheduled_at);
  const endDate = new Date(startDate.getTime() + event.duration_minutes * 60000);

  // Safely get status config with fallback
  const currentStatusConfig = statusConfig[event.status] || statusConfig.pending;
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title || 'Event Details'}
      subtitle={`${format(startDate, 'EEEE, MMMM d, yyyy')}`}
      size="lg"
      showCloseButton={true}
      className="event-details-modal"
    >
      <div className="space-y-6 p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${currentStatusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{currentStatusConfig.label}</span>
          </div>
          
          {/* Meeting Type Badge */}
          {event.meeting_type && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full">
              {event.meeting_type.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.meeting_type.color }}
                />
              )}
              <span className="text-sm font-medium">{event.meeting_type.name}</span>
            </div>
          )}
        </div>

        {/* Time & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <ClockIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Time</p>
              <p className="text-sm text-gray-900 mt-0.5">
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Duration</p>
              <p className="text-sm text-gray-900 mt-0.5">
                {event.duration_minutes} minutes
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{event.customer_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              <a
                href={`mailto:${event.customer_email}`}
                className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
              >
                {event.customer_email}
              </a>
            </div>

            {event.customer_phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <a
                  href={`tel:${event.customer_phone}`}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {event.customer_phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {event.notes && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start gap-3">
              <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Status Change - Always visible for admins */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Change Status</p>
              <div className="flex flex-wrap gap-2">
                {event.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className="px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    Pending
                  </button>
                )}
                {event.status !== 'scheduled' && (
                  <button
                    onClick={() => handleStatusChange('scheduled')}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Scheduled
                  </button>
                )}
                {event.status !== 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Confirmed
                  </button>
                )}
                {event.status !== 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    In Progress
                  </button>
                )}
                {event.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {event.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {event.status !== 'no_show' && (
                  <button
                    onClick={() => handleStatusChange('no_show')}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    No Show
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              {onDelete && event.status !== 'completed' && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Permanently remove this booking"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}

              {onCancel && event.status !== 'cancelled' && (
                <button
                  onClick={handleCancelClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Cancel Event</span>
                </button>
              )}

              {onEdit && event.status !== 'cancelled' && event.status !== 'completed' && event.status !== 'no_show' && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-500">
          <p>Created: {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}</p>
          {event.updated_at !== event.created_at && (
            <p className="mt-1">Updated: {format(new Date(event.updated_at), 'MMM d, yyyy h:mm a')}</p>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Event?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this event? The customer will be notified.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
