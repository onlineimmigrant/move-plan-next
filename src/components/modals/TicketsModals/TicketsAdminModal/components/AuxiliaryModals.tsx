'use client';

import React from 'react';
import Toast from '@/components/Toast';
import AvatarManagementModal from '@/components/modals/AvatarManagementModal/AvatarManagementModal';
import { TicketAnalytics } from '../TicketAnalytics';
import AssignmentRulesModal from '@/components/modals/AssignmentRulesModal/AssignmentRulesModal';
import { ConfirmationDialog } from './index';
import type { Ticket, AdminUser } from '../types';

interface AuxiliaryModalsProps {
  // Toast state
  toast: { message: string; type: 'success' | 'error' } | null;
  onCloseToast: () => void;
  
  // Close confirmation
  showCloseConfirmation: boolean;
  ticketToClose: { id: string; subject: string } | null;
  onConfirmClose: () => Promise<void>;
  onCancelClose: () => void;
  
  // Avatar management
  showAvatarManagement: boolean;
  avatarManagementCreateMode: boolean;
  onCloseAvatarManagement: () => void;
  onAvatarUpdated: () => void;
  organizationId: string | undefined;
  
  // Analytics
  showAnalytics: boolean;
  tickets: Ticket[];
  adminUsers: AdminUser[];
  onCloseAnalytics: () => void;
  
  // Assignment rules
  showAssignmentRules: boolean;
  onCloseAssignmentRules: () => void;
}

export default function AuxiliaryModals({
  toast,
  onCloseToast,
  showCloseConfirmation,
  ticketToClose,
  onConfirmClose,
  onCancelClose,
  showAvatarManagement,
  avatarManagementCreateMode,
  onCloseAvatarManagement,
  onAvatarUpdated,
  organizationId,
  showAnalytics,
  tickets,
  adminUsers,
  onCloseAnalytics,
  showAssignmentRules,
  onCloseAssignmentRules,
}: AuxiliaryModalsProps) {
  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={onCloseToast}
        />
      )}

      {/* Close Ticket Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCloseConfirmation && !!ticketToClose}
        title="Close Ticket?"
        message="Are you sure you want to close this ticket?"
        details={ticketToClose ? {
          label: 'Ticket Subject',
          value: ticketToClose.subject
        } : undefined}
        consequences={[
          'Mark the ticket as resolved',
          'Send a notification to the customer',
          'Move the ticket to the closed section'
        ]}
        confirmText="Close Ticket"
        cancelText="Cancel"
        variant="danger"
        onConfirm={onConfirmClose}
        onCancel={onCancelClose}
      />

      {/* Avatar Management Modal */}
      {showAvatarManagement && (
        <AvatarManagementModal
          isOpen={showAvatarManagement}
          onClose={onCloseAvatarManagement}
          onAvatarUpdated={onAvatarUpdated}
          startInCreateMode={avatarManagementCreateMode}
          organizationId={organizationId}
        />
      )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <TicketAnalytics
          tickets={tickets}
          adminUsers={adminUsers}
          onClose={onCloseAnalytics}
        />
      )}

      {/* Assignment Rules & Automation */}
      {showAssignmentRules && (
        <AssignmentRulesModal
          isOpen={showAssignmentRules}
          onClose={onCloseAssignmentRules}
        />
      )}
    </>
  );
}
