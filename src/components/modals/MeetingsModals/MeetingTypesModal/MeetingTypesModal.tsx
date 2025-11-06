// MeetingTypesModal - Dedicated modal for managing meeting types
'use client';

import React, { useState, useEffect, useRef } from 'react';
import MeetingTypesSection from './MeetingTypesSection';
import AddEditMeetingTypeModal from './AddEditMeetingTypeModal';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MeetingTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

/**
 * MeetingTypesModal
 * 
 * Dedicated modal for managing meeting types, separate from global settings.
 * Allows admins to:
 * - View all meeting types
 * - Add new meeting types
 * - Edit existing meeting types
 * - Activate/deactivate meeting types
 * 
 * @example
 * ```tsx
 * <MeetingTypesModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   organizationId={orgId}
 * />
 * ```
 */
export default function MeetingTypesModal({ isOpen, onClose, organizationId }: MeetingTypesModalProps) {
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMeetingType, setEditingMeetingType] = useState<any>(null);
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
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
        // Shift+Tab: moving backwards
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Auto-focus first element when modal opens
    const timer = setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handleClose = () => {
    setShowAddEditModal(false);
    setEditingMeetingType(null);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10002] p-4 animate-in fade-in duration-200"
        onClick={handleClose}
        role="presentation"
      >
        {/* Modal Container */}
        <div 
          ref={modalRef}
          className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
          role="dialog"
          aria-labelledby="meeting-types-modal-title"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleClose();
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30">
            <div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" style={{ color: primary.base }} />
                <h2 
                  id="meeting-types-modal-title"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  Appointment Types
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage available appointment types for customer bookings
              </p>
            </div>
            <button
              ref={firstFocusableRef}
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close modal (Esc)"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 bg-white/20 dark:bg-gray-900/20 overflow-y-auto flex-1">
            <MeetingTypesSection
              organizationId={organizationId}
              onAddClick={() => {
                setEditingMeetingType(null);
                setShowAddEditModal(true);
              }}
              onEditClick={(meetingType: any) => {
                setEditingMeetingType(meetingType);
                setShowAddEditModal(true);
              }}
            />
          </div>

          {/* Footer (hidden element for focus trap) */}
          <button
            ref={lastFocusableRef}
            onClick={handleClose}
            className="sr-only"
            aria-label="Close modal (hidden)"
            tabIndex={-1}
          />
        </div>
      </div>

      {/* Add/Edit Meeting Type Modal */}
      <AddEditMeetingTypeModal
        isOpen={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingMeetingType(null);
        }}
        onSave={() => {
          // Refresh the meeting types list
          window.dispatchEvent(new CustomEvent('refreshMeetingTypes'));
        }}
        organizationId={organizationId}
        meetingType={editingMeetingType}
      />
    </>
  );
}
