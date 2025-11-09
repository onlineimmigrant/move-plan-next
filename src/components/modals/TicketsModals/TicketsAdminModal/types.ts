/**
 * TicketsAdminModal Type Definitions
 * 
 * This file contains TypeScript type definitions specific to the TicketsAdminModal component.
 * Shared types are imported from ../shared/types for consistency across the application.
 * 
 * @module types
 * 
 * Type Categories:
 * 1. Shared Types - Re-exported from ../shared/types
 * 2. Filter & Sort Types - Admin-specific filtering and sorting
 * 3. Component Props Types - Props interfaces for sub-components
 * 4. Constants - Type-safe constant arrays
 * 
 * @example
 * ```typescript
 * import type { Ticket, TicketFilters, SortBy } from './types';
 * 
 * const filters: TicketFilters = {
 *   searchQuery: '',
 *   activeTab: 'open',
 *   priorityFilter: 'high',
 *   assignmentFilter: 'my',
 *   tagFilter: 'all',
 *   sortBy: 'date-newest'
 * };
 * ```
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

/**
 * Ticket status filter values
 * @typedef {'all' | 'open' | 'in progress' | 'closed'} TicketStatus
 */
export type TicketStatus = 'all' | 'open' | 'in progress' | 'closed';

/**
 * Ticket priority filter values
 * @typedef {'all' | 'high' | 'medium' | 'low'} TicketPriority
 */
export type TicketPriority = 'all' | 'high' | 'medium' | 'low';

/**
 * Assignment filter options
 * - 'all': Show all tickets regardless of assignment
 * - 'my': Show only tickets assigned to current user
 * - 'unassigned': Show only unassigned tickets
 * @typedef {'all' | 'my' | 'unassigned'} AssignmentFilter
 */
export type AssignmentFilter = 'all' | 'my' | 'unassigned';

/**
 * Sort order options for ticket list
 * - 'date-newest': Most recent tickets first
 * - 'date-oldest': Oldest tickets first
 * - 'priority': High priority first
 * - 'responses': Most responses first
 * - 'updated': Recently updated first
 * @typedef {'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated'} SortBy
 */
export type SortBy = 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated';

/**
 * Filter logic for advanced multi-select filters
 * - 'AND': All selected filters must match
 * - 'OR': Any selected filter can match
 * @typedef {'AND' | 'OR'} FilterLogic
 */
export type FilterLogic = 'AND' | 'OR';

/**
 * Basic ticket filters interface
 * Used for primary filtering controls in the UI
 * 
 * @interface TicketFilters
 * @example
 * ```typescript
 * const defaultFilters: TicketFilters = {
 *   searchQuery: '',
 *   activeTab: 'all',
 *   priorityFilter: 'all',
 *   assignmentFilter: 'all',
 *   tagFilter: 'all',
 *   sortBy: 'date-newest'
 * };
 * ```
 */
export interface TicketFilters {
  /** Text search query for filtering tickets */
  searchQuery: string;
  /** Active status tab filter */
  activeTab: TicketStatus;
  /** Priority level filter */
  priorityFilter: TicketPriority;
  /** Assignment status filter */
  assignmentFilter: AssignmentFilter;
  /** Tag filter ('all' or specific tag_id) */
  tagFilter: string;
  /** Sort order for ticket list */
  sortBy: SortBy;
}

/**
 * Advanced filtering options
 * Extended filters for power users
 * 
 * @interface AdvancedFilters
 * @example
 * ```typescript
 * const advancedFilters: AdvancedFilters = {
 *   showAdvancedFilters: true,
 *   dateRangeStart: '2024-01-01',
 *   dateRangeEnd: '2024-12-31',
 *   multiSelectStatuses: ['open', 'in progress'],
 *   multiSelectPriorities: ['high', 'medium'],
 *   multiSelectTags: ['tag-1', 'tag-2'],
 *   multiSelectAssignees: ['admin-1', 'admin-2'],
 *   filterLogic: 'AND'
 * };
 * ```
 */
export interface AdvancedFilters {
  /** Whether advanced filters panel is visible */
  showAdvancedFilters: boolean;
  /** Start date for date range filter (ISO format) */
  dateRangeStart: string;
  /** End date for date range filter (ISO format) */
  dateRangeEnd: string;
  /** Multiple status selections */
  multiSelectStatuses: string[];
  /** Multiple priority selections */
  multiSelectPriorities: string[];
  /** Multiple tag selections */
  multiSelectTags: string[];
  /** Multiple assignee selections */
  multiSelectAssignees: string[];
  /** Logic operator for combining filters */
  filterLogic: FilterLogic;
}

/**
 * Tickets grouped by status
 * Result of filtering and grouping operations
 * 
 * @interface GroupedTickets
 * @example
 * ```typescript
 * const grouped: GroupedTickets = {
 *   all: [...allTickets],
 *   open: [...openTickets],
 *   'in progress': [...inProgressTickets],
 *   closed: [...closedTickets]
 * };
 * ```
 */
export interface GroupedTickets {
  /** All tickets (unfiltered by status) */
  all: Ticket[];
  /** Open status tickets */
  open: Ticket[];
  /** In progress status tickets */
  'in progress': Ticket[];
  /** Closed status tickets */
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
