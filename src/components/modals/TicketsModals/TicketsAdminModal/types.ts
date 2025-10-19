/**
 * TicketsAdminModal-specific TypeScript types
 * Shared types are imported from ../shared/types
 */

// Import shared types
import type {
  Ticket,
  TicketResponse,
  TicketNote,
  TicketTag,
  TicketTagAssignment,
  Avatar,
  AdminUser,
  PredefinedResponse,
  WidgetSize,
  ToastState,
  MessageItemProps,
  TicketAttachment,
} from '../shared/types';

// Re-export shared types for backward compatibility
export type {
  Ticket,
  TicketResponse,
  TicketNote,
  TicketTag,
  TicketTagAssignment,
  Avatar,
  AdminUser,
  PredefinedResponse,
  WidgetSize,
  ToastState,
  MessageItemProps,
  TicketAttachment,
} from '../shared/types';

// ============================================================================
// Admin-Specific Filter & Sort Types
// ============================================================================

export type TicketStatus = 'all' | 'open' | 'in progress' | 'closed';
export type TicketPriority = 'all' | 'high' | 'medium' | 'low';
export type AssignmentFilter = 'all' | 'my' | 'unassigned';
export type SortBy = 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated';
export type FilterLogic = 'AND' | 'OR';

export interface TicketFilters {
  searchQuery: string;
  activeTab: TicketStatus;
  priorityFilter: TicketPriority;
  assignmentFilter: AssignmentFilter;
  tagFilter: string; // 'all' or tag_id
  sortBy: SortBy;
}

export interface AdvancedFilters {
  showAdvancedFilters: boolean;
  dateRangeStart: string;
  dateRangeEnd: string;
  multiSelectStatuses: string[];
  multiSelectPriorities: string[];
  multiSelectTags: string[];
  multiSelectAssignees: string[];
  filterLogic: FilterLogic;
}

export interface GroupedTickets {
  all: Ticket[];
  open: Ticket[];
  'in progress': Ticket[];
  closed: Ticket[];
}

// ============================================================================
// Constants
// ============================================================================

export const TICKET_STATUSES: TicketStatus[] = ['all', 'in progress', 'open', 'closed'];

export const TICKET_PRIORITIES: TicketPriority[] = ['all', 'high', 'medium', 'low'];

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'date-newest', label: 'Newest First' },
  { value: 'date-oldest', label: 'Oldest First' },
  { value: 'priority', label: 'Priority' },
  { value: 'responses', label: 'Most Responses' },
  { value: 'updated', label: 'Recently Updated' },
];

// ============================================================================
// Component Props Types
// ============================================================================

export interface TicketsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
  hasPinnedNotes: boolean;
  unreadCount: number;
}

export interface TicketDetailViewProps {
  ticket: Ticket;
  onClose: () => void;
  adminUsers: AdminUser[];
  avatars: Avatar[];
}

export interface TicketMetadataProps {
  ticket: Ticket;
  adminUsers: AdminUser[];
  onStatusChange: (status: string) => Promise<void>;
  onPriorityChange: (priority: string) => Promise<void>;
  onAssignmentChange: (adminId: string) => Promise<void>;
  isUpdating: boolean;
}

// MessageItemProps is imported from shared/types

// ============================================================================
// Hook Return Types
// ============================================================================
