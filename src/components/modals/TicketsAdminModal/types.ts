/**
 * Shared TypeScript types for TicketsAdminModal and related components
 */

import { TicketAttachment } from '@/lib/fileUpload';

// ============================================================================
// Core Ticket Types
// ============================================================================

export interface TicketResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  created_by?: string | null;
  avatar_id?: string;
  is_read?: boolean;
  read_at?: string;
  attachments?: TicketAttachment[];
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  admin_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  admin_email?: string;
  admin_full_name?: string;
}

export interface TicketTag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
}

export interface TicketTagAssignment {
  ticket_id: string;
  tag_id: string;
  tag?: TicketTag;
}

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  customer_id: string | null;
  created_at: string;
  message: string;
  preferred_contact_method: string | null;
  email: string;
  full_name?: string;
  assigned_to?: string | null;
  priority?: string;
  ticket_responses: TicketResponse[];
  tags?: TicketTag[];
}

// ============================================================================
// Avatar & Admin Types
// ============================================================================

export interface Avatar {
  id: string;
  title: string;
  full_name?: string;
  image?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface PredefinedResponse {
  id: string;
  order: number;
  subject: string;
  text: string;
}

// ============================================================================
// Filter & Sort Types
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
// UI State Types
// ============================================================================

export type WidgetSize = 'initial' | 'half' | 'fullscreen';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
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

export interface MessageItemProps {
  message: TicketResponse;
  isAdmin: boolean;
  avatar?: Avatar;
  senderName?: string;
  senderEmail?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================
