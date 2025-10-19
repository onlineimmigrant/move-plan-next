# TicketsAdminModal Refactoring Plan

## 📊 Current State Analysis

**File**: `src/components/modals/TicketsAdminModal/TicketsAdminModal.tsx`
**Size**: 3,907 lines
**Issues**: 
- Single monolithic component handling too many responsibilities
- 40+ state variables
- Complex business logic mixed with UI rendering
- Difficult to test, maintain, and extend
- Performance concerns (unnecessary re-renders)

---

## 🎯 Refactoring Goals

1. **Separation of Concerns**: Split into logical, single-responsibility components
2. **Reusability**: Create reusable sub-components
3. **Maintainability**: Easier to understand, test, and modify
4. **Performance**: Reduce unnecessary re-renders with proper memoization
5. **Testability**: Isolated components are easier to unit test
6. **Type Safety**: Shared types in dedicated files

---

## 📁 Proposed Directory Structure

```
src/components/modals/TicketsAdminModal/
├── TicketsAdminModal.tsx                    # Main orchestrator (200-300 lines)
├── types.ts                                 # Shared TypeScript interfaces
├── hooks/
│   ├── useTicketData.ts                    # Data fetching & management
│   ├── useTicketFilters.ts                 # Filter state & logic
│   ├── useTicketActions.ts                 # CRUD operations
│   ├── useRealtimeSubscription.ts          # Supabase realtime
│   └── useTicketMarkAsRead.ts              # Mark as read logic
├── components/
│   ├── TicketSidebar/
│   │   ├── TicketSidebar.tsx              # Left panel container
│   │   ├── TicketSearchBar.tsx            # Search input
│   │   ├── TicketFilterBar.tsx            # Filter controls
│   │   ├── AdvancedFilters.tsx            # Advanced filter panel
│   │   ├── TicketStatusTabs.tsx           # Status tab navigation
│   │   ├── TicketList.tsx                 # List of tickets
│   │   └── TicketListItem.tsx             # Individual ticket card
│   ├── TicketDetail/
│   │   ├── TicketDetailView.tsx           # Right panel container
│   │   ├── TicketHeader.tsx               # Ticket header with actions
│   │   ├── TicketMetadata.tsx             # Status, priority, assignment
│   │   ├── TicketConversation.tsx         # Messages thread
│   │   ├── MessageItem.tsx                # Individual message
│   │   ├── TicketResponseForm.tsx         # Reply input area
│   │   └── TicketTabs.tsx                 # Responses/Notes tabs
│   ├── TicketNotes/
│   │   ├── InternalNotesPanel.tsx         # Notes container
│   │   ├── NotesList.tsx                  # List of notes
│   │   ├── NoteItem.tsx                   # Individual note
│   │   └── NoteForm.tsx                   # Add note form
│   ├── TicketTags/
│   │   ├── TagSelector.tsx                # Tag selection dropdown
│   │   ├── TagChip.tsx                    # Individual tag display
│   │   └── TagManagement.tsx              # Create/edit tags
│   ├── TicketAttachments/
│   │   ├── AttachmentUploader.tsx         # File upload component
│   │   ├── AttachmentList.tsx             # List of attachments
│   │   └── AttachmentPreview.tsx          # Preview modal
│   ├── TicketActions/
│   │   ├── StatusDropdown.tsx             # Change status
│   │   ├── PriorityDropdown.tsx           # Change priority
│   │   ├── AssignmentDropdown.tsx         # Assign to admin
│   │   └── AvatarSelector.tsx             # Select response avatar
│   └── shared/
│       ├── CloseConfirmationDialog.tsx    # Confirm close ticket
│       ├── EmptyState.tsx                 # No tickets message
│       └── LoadingStates.tsx              # Loading skeletons
├── utils/
│   ├── ticketFiltering.ts                 # Filter logic
│   ├── ticketSorting.ts                   # Sort logic
│   └── ticketGrouping.ts                  # Group by status
└── TicketAnalytics.tsx                    # Already separated ✅
```

---

## 🔧 Refactoring Steps

### **Phase 1: Extract Types & Utilities** (Foundation)

#### Step 1.1: Create Shared Types File
**File**: `types.ts`
**Purpose**: Centralize all TypeScript interfaces
**Content**:
- `Ticket`, `TicketResponse`, `TicketNote`, `TicketTag`
- `Avatar`, `PredefinedResponse`, `AdminUser`
- `TicketFilters`, `TicketSortOptions`
- Enums for status, priority, etc.

#### Step 1.2: Create Utility Functions
**Files**: `utils/ticketFiltering.ts`, `utils/ticketSorting.ts`, `utils/ticketGrouping.ts`
**Purpose**: Extract pure functions from component
**Functions**:
- `filterTicketsBySearch(tickets, query)`
- `filterTicketsByStatus(tickets, status)`
- `filterTicketsByPriority(tickets, priority)`
- `sortTickets(tickets, sortBy)`
- `groupTicketsByStatus(tickets)`

---

### **Phase 2: Extract Custom Hooks** (Business Logic)

#### Step 2.1: Create Data Fetching Hook
**File**: `hooks/useTicketData.ts`
**Responsibilities**:
- Fetch tickets from Supabase
- Fetch avatars, admin users, predefined responses
- Fetch tags, notes
- Pagination logic
- Loading states

**Exports**:
```typescript
const {
  tickets,
  avatars,
  adminUsers,
  availableTags,
  isLoadingTickets,
  hasMoreTickets,
  fetchMoreTickets,
  refetchTickets
} = useTicketData(organizationId);
```

#### Step 2.2: Create Filter Hook
**File**: `hooks/useTicketFilters.ts`
**Responsibilities**:
- Manage all filter state (search, status, priority, tags, assignment)
- Advanced filters state
- Persist filters to localStorage
- Restore filters on mount
- Compute filtered & sorted tickets

**Exports**:
```typescript
const {
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  priorityFilter,
  assignmentFilter,
  tagFilter,
  sortBy,
  filteredTickets,
  groupedTickets,
  clearFilters
} = useTicketFilters(tickets, currentUserId);
```

#### Step 2.3: Create Actions Hook
**File**: `hooks/useTicketActions.ts`
**Responsibilities**:
- Submit response
- Change ticket status
- Assign ticket
- Update priority
- Add/delete internal notes
- Pin/unpin notes
- Tag management

**Exports**:
```typescript
const {
  submitResponse,
  changeStatus,
  assignTicket,
  updatePriority,
  addNote,
  deleteNote,
  togglePinNote,
  addTag,
  removeTag
} = useTicketActions(organizationId, selectedTicket);
```

#### Step 2.4: Create Realtime Hook
**File**: `hooks/useRealtimeSubscription.ts`
**Responsibilities**:
- Setup Supabase realtime subscription
- Handle INSERT/UPDATE/DELETE events
- Update local state on realtime events
- Cleanup on unmount

**Exports**:
```typescript
useRealtimeSubscription(organizationId, onTicketUpdate);
```

#### Step 2.5: Create Mark As Read Hook
**File**: `hooks/useTicketMarkAsRead.ts`
**Responsibilities**:
- Mark messages as read when viewed
- Track visibility/focus state
- Periodic mark as read while active
- Handle tab visibility changes

**Exports**:
```typescript
useTicketMarkAsRead(selectedTicketId, isOpen);
```

---

### **Phase 3: Extract UI Components** (Presentation)

#### Step 3.1: Extract Sidebar Components

##### 3.1.1 TicketSidebar.tsx
**Purpose**: Container for left panel
**Props**: 
```typescript
{
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isLoading: boolean;
}
```

##### 3.1.2 TicketSearchBar.tsx
**Purpose**: Search input with clear button
**Props**: 
```typescript
{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

##### 3.1.3 TicketFilterBar.tsx
**Purpose**: Assignment, priority, tag, sort filters
**Props**: 
```typescript
{
  assignmentFilter: FilterType;
  priorityFilter: FilterType;
  tagFilter: string;
  sortBy: SortType;
  onFilterChange: (filter: string, value: any) => void;
  adminUsers: AdminUser[];
  tags: TicketTag[];
}
```

##### 3.1.4 AdvancedFilters.tsx
**Purpose**: Collapsible advanced filter panel
**Props**: 
```typescript
{
  isOpen: boolean;
  onToggle: () => void;
  filters: AdvancedFilterState;
  onFilterChange: (filters: AdvancedFilterState) => void;
  adminUsers: AdminUser[];
  tags: TicketTag[];
}
```

##### 3.1.5 TicketStatusTabs.tsx
**Purpose**: Status tab navigation (all, open, in progress, closed)
**Props**: 
```typescript
{
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: { [status: string]: number };
}
```

##### 3.1.6 TicketList.tsx
**Purpose**: Scrollable list of tickets
**Props**: 
```typescript
{
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}
```

##### 3.1.7 TicketListItem.tsx
**Purpose**: Individual ticket card in list
**Props**: 
```typescript
{
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
  hasPinnedNotes: boolean;
  unreadCount: number;
}
```

---

#### Step 3.2: Extract Detail View Components

##### 3.2.1 TicketDetailView.tsx
**Purpose**: Container for right panel
**Props**: 
```typescript
{
  ticket: Ticket;
  onClose: () => void;
  adminUsers: AdminUser[];
  avatars: Avatar[];
}
```

##### 3.2.2 TicketHeader.tsx
**Purpose**: Header with close, resize, analytics buttons
**Props**: 
```typescript
{
  ticket: Ticket;
  onClose: () => void;
  onResize: () => void;
  onShowAnalytics: () => void;
  onShowRules: () => void;
}
```

##### 3.2.3 TicketMetadata.tsx
**Purpose**: Status, priority, assignment info
**Props**: 
```typescript
{
  ticket: Ticket;
  adminUsers: AdminUser[];
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onAssignmentChange: (adminId: string) => void;
  isUpdating: boolean;
}
```

##### 3.2.4 TicketConversation.tsx
**Purpose**: Message thread display
**Props**: 
```typescript
{
  responses: TicketResponse[];
  avatars: Avatar[];
  ticketEmail: string;
  ticketFullName?: string;
}
```

##### 3.2.5 MessageItem.tsx
**Purpose**: Single message bubble (admin or customer)
**Props**: 
```typescript
{
  message: TicketResponse;
  isAdmin: boolean;
  avatar?: Avatar;
  senderName?: string;
  senderEmail?: string;
}
```

##### 3.2.6 TicketResponseForm.tsx
**Purpose**: Compose reply area with attachments
**Props**: 
```typescript
{
  ticketId: string;
  onSubmit: (message: string, files: File[]) => Promise<void>;
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  onAvatarChange: (avatar: Avatar) => void;
  predefinedResponses: PredefinedResponse[];
}
```

##### 3.2.7 TicketTabs.tsx
**Purpose**: Switch between Responses and Internal Notes
**Props**: 
```typescript
{
  activeTab: 'responses' | 'notes';
  onTabChange: (tab: 'responses' | 'notes') => void;
  notesCount: number;
}
```

---

#### Step 3.3: Extract Notes Components

##### 3.3.1 InternalNotesPanel.tsx
**Purpose**: Container for internal notes
**Props**: 
```typescript
{
  ticketId: string;
  notes: TicketNote[];
  onAddNote: (text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onTogglePin: (noteId: string) => Promise<void>;
}
```

##### 3.3.2 NotesList.tsx
**Purpose**: List of notes (pinned first)
**Props**: 
```typescript
{
  notes: TicketNote[];
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
}
```

##### 3.3.3 NoteItem.tsx
**Purpose**: Single note display
**Props**: 
```typescript
{
  note: TicketNote;
  onDelete: () => void;
  onTogglePin: () => void;
}
```

##### 3.3.4 NoteForm.tsx
**Purpose**: Add new note input
**Props**: 
```typescript
{
  onSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
}
```

---

#### Step 3.4: Extract Action Components

##### 3.4.1 StatusDropdown.tsx
**Purpose**: Change ticket status
**Props**: 
```typescript
{
  currentStatus: string;
  onChange: (status: string) => void;
  isUpdating: boolean;
}
```

##### 3.4.2 PriorityDropdown.tsx
**Purpose**: Change ticket priority
**Props**: 
```typescript
{
  currentPriority?: string;
  onChange: (priority: string) => void;
  isUpdating: boolean;
}
```

##### 3.4.3 AssignmentDropdown.tsx
**Purpose**: Assign ticket to admin
**Props**: 
```typescript
{
  currentAssignee?: string;
  adminUsers: AdminUser[];
  onChange: (adminId: string) => void;
  isUpdating: boolean;
}
```

##### 3.4.4 AvatarSelector.tsx
**Purpose**: Select response avatar
**Props**: 
```typescript
{
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  onChange: (avatar: Avatar) => void;
  onManageAvatars: () => void;
}
```

---

#### Step 3.5: Extract Shared Components

##### 3.5.1 CloseConfirmationDialog.tsx
**Purpose**: Confirm before closing ticket
**Props**: 
```typescript
{
  isOpen: boolean;
  ticketSubject: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

##### 3.5.2 EmptyState.tsx
**Purpose**: No tickets found message
**Props**: 
```typescript
{
  message: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}
```

##### 3.5.3 LoadingStates.tsx
**Purpose**: Skeleton loaders for different sections
**Exports**: 
```typescript
export const TicketListSkeleton: React.FC = () => {...};
export const TicketDetailSkeleton: React.FC = () => {...};
```

---

### **Phase 4: Extract Attachment Components**

#### 4.1 AttachmentUploader.tsx
**Purpose**: File upload with drag & drop
**Props**: 
```typescript
{
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number;
  allowedTypes?: string[];
}
```

#### 4.2 AttachmentList.tsx
**Purpose**: Display list of attachments
**Props**: 
```typescript
{
  attachments: TicketAttachment[];
  onDownload: (attachment: TicketAttachment) => void;
  onDelete?: (attachment: TicketAttachment) => void;
  showPreview?: boolean;
}
```

#### 4.3 AttachmentPreview.tsx
**Purpose**: Preview images/PDFs in modal
**Props**: 
```typescript
{
  attachment: TicketAttachment;
  isOpen: boolean;
  onClose: () => void;
}
```

---

### **Phase 5: Extract Tag Components**

#### 5.1 TagSelector.tsx
**Purpose**: Select tags for ticket
**Props**: 
```typescript
{
  availableTags: TicketTag[];
  selectedTags: TicketTag[];
  onTagAdd: (tag: TicketTag) => void;
  onTagRemove: (tag: TicketTag) => void;
  onManageTags: () => void;
}
```

#### 5.2 TagChip.tsx
**Purpose**: Display individual tag
**Props**: 
```typescript
{
  tag: TicketTag;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}
```

#### 5.3 TagManagement.tsx
**Purpose**: Create/edit/delete tags
**Props**: 
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onTagsUpdated: () => void;
}
```

---

## 🔄 Migration Strategy

### Approach: **Incremental Refactoring**

We'll refactor incrementally to avoid breaking the application:

1. **Create new components alongside existing code**
2. **Test each component in isolation**
3. **Replace sections of the monolith one at a time**
4. **Keep the main modal working throughout**

### Order of Execution:

```
Phase 1 (Types & Utils)
  ↓
Phase 2 (Custom Hooks)
  ↓
Phase 3.1 (Sidebar Components)
  ↓
Phase 3.2 (Detail View Components)
  ↓
Phase 3.3 (Notes Components)
  ↓
Phase 3.4 (Action Components)
  ↓
Phase 3.5 (Shared Components)
  ↓
Phase 4 (Attachment Components)
  ↓
Phase 5 (Tag Components)
  ↓
Final: Update TicketsAdminModal.tsx to orchestrate all components
```

---

## 📊 Expected Outcome

### Before Refactoring:
- **Main File**: 3,907 lines
- **Components**: 1 (monolithic)
- **Testability**: Very difficult
- **Reusability**: None
- **Maintainability**: Low

### After Refactoring:
- **Main File**: ~250 lines (orchestrator only)
- **Components**: 35+ modular components
- **Custom Hooks**: 5 focused hooks
- **Utility Files**: 3 pure function modules
- **Type Definitions**: 1 centralized file
- **Testability**: High (isolated components)
- **Reusability**: High (composable components)
- **Maintainability**: Very High
- **Performance**: Improved (memoization, less re-renders)

---

## 🎯 Key Benefits

1. **Single Responsibility**: Each component has one clear purpose
2. **Easier Testing**: Test components in isolation
3. **Better Performance**: Memoization prevents unnecessary re-renders
4. **Code Reuse**: Components can be used in other parts of the app
5. **Easier Onboarding**: New developers can understand smaller pieces
6. **Parallel Development**: Multiple developers can work on different components
7. **Type Safety**: Centralized types reduce duplication
8. **Maintainability**: Bugs are easier to locate and fix

---

## 🚀 Next Steps

1. **Review this plan** - Confirm the structure makes sense
2. **Start with Phase 1** - Extract types and utilities
3. **Build incrementally** - One phase at a time
4. **Test thoroughly** - Ensure no functionality is lost
5. **Document components** - Add JSDoc comments for each component

---

## 📝 Notes

- **MentionInput Integration**: Already working in notes section, will be preserved
- **Existing Modals**: TicketAnalytics, AssignmentRulesModal, AvatarManagementModal already separated
- **Real-time Features**: Will be handled by dedicated hook
- **File Uploads**: Will be in dedicated attachment components
- **Backwards Compatibility**: All existing features will continue to work

---

## ⚠️ Considerations

1. **State Management**: May consider Context API or Zustand if prop drilling becomes excessive
2. **Performance**: Use `React.memo()`, `useMemo()`, `useCallback()` where appropriate
3. **Bundle Size**: Tree-shaking will help keep bundle small
4. **Type Safety**: Ensure all props are properly typed
5. **Testing**: Write tests as we build components

---

**Ready to proceed?** Let me know if you'd like to:
- Modify any part of this structure
- Start with a specific phase
- Add/remove any components
- Discuss alternative approaches
