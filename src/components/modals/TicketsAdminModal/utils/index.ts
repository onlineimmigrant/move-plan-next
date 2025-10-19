/**
 * Barrel export for ticket utility functions
 * This provides a clean import path for all utilities
 * 
 * Usage:
 * import { filterTicketsBySearch, sortTickets, groupTicketsByStatus } from './utils';
 */

// Export all filtering utilities
export {
  filterTicketsBySearch,
  filterTicketsByStatus,
  filterTicketsByPriority,
  filterTicketsByAssignment,
  filterTicketsByTag,
  filterTicketsByDateRange,
  filterTicketsByMultipleStatuses,
  filterTicketsByMultiplePriorities,
  filterTicketsByMultipleTags,
  filterTicketsByMultipleAssignees,
  applyAdvancedFilters,
  applyAllFilters,
  hasActiveFilters,
} from './ticketFiltering';

// Export all sorting utilities
export {
  sortByDateNewest,
  sortByDateOldest,
  sortByPriority,
  sortByResponseCount,
  sortByRecentlyUpdated,
  sortTickets,
  sortTicketsCustom,
  getSortLabel,
} from './ticketSorting';

// Export all grouping utilities
export {
  groupTicketsByStatus,
  countTicketsByStatus,
  groupTicketsByPriority,
  countTicketsByPriority,
  groupTicketsByAssignee,
  countTicketsByAssignee,
  groupTicketsByTag,
  countTicketsByTag,
  groupTicketsByDateRange,
  getTicketsWithUnreadMessages,
  countUnreadMessagesPerTicket,
  getTotalUnreadCount,
} from './ticketGrouping';

// Export all helper utilities
export {
  isWaitingForResponse,
  getUnreadCount,
  getPriorityBadgeClass,
  getPriorityLabel,
  getStatusBadgeClass,
  getInitials,
  escapeRegex,
  getHighlightedParts,
  getRelativeTime,
  getLatestResponse,
  hasUnreadMessages,
  getMessagePreview,
  formatFullDate,
  formatTimeOnly,
  getCurrentISOString,
  formatNoteDate,
  getAvatarForResponse,
  getAvatarClasses,
  getContainerClasses,
  getStatusTextClass,
  getPriorityTextClass,
  getDisplayName,
  getAvatarDisplayName,
} from './ticketHelpers';
