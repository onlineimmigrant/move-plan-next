/**
 * Barrel export for TicketsAccountModal utilities
 * Provides clean imports for all utility functions
 */

export {
  isWaitingForResponse,
  getStatusBadgeClass,
  getAvatarForResponse,
  groupTicketsByStatus,
} from './ticketHelpers';

// Re-export shared utilities for convenience
export {
  getInitials,
  renderAvatar,
  getContainerClasses,
  loadAttachmentUrls,
  broadcastTyping,
  processTicketResponses,
  scrollToBottom,
} from '../../shared/utils';
