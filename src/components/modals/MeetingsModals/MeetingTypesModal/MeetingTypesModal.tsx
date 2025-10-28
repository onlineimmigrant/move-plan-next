// MeetingTypesModal - Dedicated modal for managing meeting types
'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import MeetingTypesSection from './MeetingTypesSection';
import AddEditMeetingTypeModal from './AddEditMeetingTypeModal';
import { ClockIcon } from '@heroicons/react/24/outline';
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

  const handleClose = () => {
    setShowAddEditModal(false);
    setEditingMeetingType(null);
    onClose();
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Appointment Types"
        subtitle="Manage available appointment types for customer bookings"
        size="xl"
        draggable={true}
        resizable={true}
        showCloseButton={true}
        showFullscreenButton={false}
        scrollable={true}
        closeOnBackdropClick={true}
        closeOnEscape={true}
        className="meeting-types-modal"
        adminBadge={true}
        adminBadgeColor={primary.base}
      >
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
      </BaseModal>

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
