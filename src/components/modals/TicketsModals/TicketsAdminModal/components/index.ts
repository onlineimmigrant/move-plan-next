/**
 * Barrel export for TicketsAdminModal components
 */

// Sidebar Components
export { TicketSearchBar } from './TicketSearchBar';
export { TicketFilterBar } from './TicketFilterBar';
export { TicketList } from './TicketList';
export { TicketListItem } from './TicketListItem';
export { TicketListView } from './TicketListView';

// Detail View Components
export { TicketHeader } from './TicketHeader';
export { TicketMessages } from './TicketMessages';
export { MessageItem } from './MessageItem';

// Action Components
export { TicketStatusBadge } from './TicketStatusBadge';
export { TicketPrioritySelector } from './TicketPrioritySelector';
export { TicketAssignmentSelector } from './TicketAssignmentSelector';
export { TicketTagManager } from './TicketTagManager';

// Modal Components
export { InternalNotesPanel } from './InternalNotesPanel';
export { PinnedNotesBanner } from './PinnedNotesBanner';
export { ConfirmationDialog } from './ConfirmationDialog';
export { TagEditorModal } from './TagEditorModal';
export { MessageInputArea } from './MessageInputArea';

// Filter Components
export { default as BottomFilters } from './BottomFilters';

// Message Components
export { default as Messages } from './Messages';

// Header Components
export { default as TicketModalHeader } from './TicketModalHeader';

// Re-export shared components
export { TypingIndicator, AvatarChangeIndicator, ReadReceipts } from '../../shared/components';
