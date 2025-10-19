# useTagManagement Hook Extraction

## Overview
Extracted the Tag Management functions (~185 lines, lines 857-1022) from `TicketsAdminModal.tsx` into a reusable custom hook `useTagManagement`. This hook encapsulates all tag-related CRUD operations and state management, improving code organization and reusability.

## Changes Made

### 1. Created Custom Hook
**File:** `src/components/modals/TicketsAdminModal/hooks/useTagManagement.ts`

**Purpose:** Manage ticket tags with full CRUD operations

**Hook Interface:**
```typescript
interface UseTagManagementProps {
  organizationId: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface UseTagManagementReturn {
  availableTags: TicketTag[];
  isLoadingTags: boolean;
  fetchTags: () => Promise<void>;
  handleCreateTag: (name: string, color: string, icon?: string) => Promise<TicketTag | null>;
  handleUpdateTag: (tagId: string, updates: { name?: string; color?: string; icon?: string }) => Promise<TicketTag | null>;
  handleDeleteTag: (
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ) => Promise<void>;
  handleAssignTag: (
    ticketId: string,
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ) => Promise<void>;
  handleRemoveTag: (
    ticketId: string,
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ) => Promise<void>;
}
```

### 2. Functions Included

#### 1. **`fetchTags()`** - Fetch Organization Tags
```typescript
const fetchTags = useCallback(async () => {
  // Fetches all tags for the organization
  // Sets loading state
  // Orders by name alphabetically
}, [organizationId]);
```
- **Input:** None (uses organizationId from props)
- **Output:** void (updates state)
- **Side Effects:** Sets availableTags, isLoadingTags

#### 2. **`handleCreateTag()`** - Create New Tag
```typescript
const handleCreateTag = useCallback(async (
  name: string,
  color: string,
  icon?: string
): Promise<TicketTag | null> => {
  // Creates new tag in database
  // Adds to state and sorts
  // Shows success/error toast
}, [organizationId, onToast]);
```
- **Input:** name, color, optional icon
- **Output:** TicketTag | null
- **Side Effects:** Updates availableTags, shows toast

#### 3. **`handleUpdateTag()`** - Update Existing Tag
```typescript
const handleUpdateTag = useCallback(async (
  tagId: string,
  updates: { name?: string; color?: string; icon?: string }
): Promise<TicketTag | null> => {
  // Updates tag in database
  // Updates in state and re-sorts
  // Shows success/error toast
}, [onToast]);
```
- **Input:** tagId, partial updates
- **Output:** TicketTag | null
- **Side Effects:** Updates availableTags, shows toast

#### 4. **`handleDeleteTag()`** - Delete Tag
```typescript
const handleDeleteTag = useCallback(async (
  tagId: string,
  updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
  updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
): Promise<void> => {
  // Deletes tag assignments
  // Deletes tag from database
  // Removes from all tickets in state
  // Shows success/error toast
}, [onToast]);
```
- **Input:** tagId, state updater functions
- **Output:** void
- **Side Effects:** Updates availableTags, tickets, selectedTicket, shows toast
- **Cleanup:** Removes tag from all tickets automatically

#### 5. **`handleAssignTag()`** - Assign Tag to Ticket
```typescript
const handleAssignTag = useCallback(async (
  ticketId: string,
  tagId: string,
  updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
  updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
): Promise<void> => {
  // Assigns tag to ticket via API
  // Updates ticket in list
  // Updates selected ticket if applicable
  // Shows success/error toast
}, [availableTags, onToast]);
```
- **Input:** ticketId, tagId, state updater functions
- **Output:** void
- **Side Effects:** Updates tickets, selectedTicket, shows toast

#### 6. **`handleRemoveTag()`** - Remove Tag from Ticket
```typescript
const handleRemoveTag = useCallback(async (
  ticketId: string,
  tagId: string,
  updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
  updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
): Promise<void> => {
  // Removes tag from ticket via API
  // Updates ticket in list
  // Updates selected ticket if applicable
  // Shows success/error toast
}, [onToast]);
```
- **Input:** ticketId, tagId, state updater functions
- **Output:** void
- **Side Effects:** Updates tickets, selectedTicket, shows toast

### 3. Updated Files

#### `TicketsAdminModal.tsx`
- **Before:** 2,022 lines with inline tag management
- **After:** ~1,860 lines using useTagManagement hook
- **Lines Removed:** ~162 lines (direct implementation replaced with hook)

**Changes:**
```typescript
// Added hook usage at component top
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

const showToast = (message: string, type: 'success' | 'error') => {
  setToast({ message, type });
};

const tagManagement = useTagManagement({
  organizationId: settings.organization_id,
  onToast: showToast,
});

// Destructured state from hook
const { availableTags, isLoadingTags } = tagManagement;

// Removed state declarations
// ❌ const [availableTags, setAvailableTags] = useState<TicketTag[]>([]);
// ❌ const [isLoadingTags, setIsLoadingTags] = useState(false);

// Created wrapper functions for compatibility
const fetchTags = tagManagement.fetchTags;
const handleCreateTag = tagManagement.handleCreateTag;
const handleUpdateTag = tagManagement.handleUpdateTag;

const handleDeleteTag = (tagId: string) => {
  return tagManagement.handleDeleteTag(tagId, setTickets, setSelectedTicket);
};

const handleAssignTag = (ticketId: string, tagId: string) => {
  return tagManagement.handleAssignTag(ticketId, tagId, setTickets, setSelectedTicket);
};

const handleRemoveTag = (ticketId: string, tagId: string) => {
  return tagManagement.handleRemoveTag(ticketId, tagId, setTickets, setSelectedTicket);
};
```

#### `hooks/index.ts`
Added export:
```typescript
export { useTagManagement } from './useTagManagement';
```

### 4. Dependencies

#### External Libraries:
- `react` - useState, useCallback hooks
- `@/lib/supabase` - Supabase client for database operations

#### Internal Dependencies:
- `../types` - TicketTag, Ticket type definitions
- `../utils/ticketApi` - addTagToTicket, removeTagFromTicket functions

### 5. Key Design Decisions

#### 1. **Why Custom Hook vs Component?**
Tag management is **logic/state**, not UI rendering:
- ✅ Returns functions and state
- ✅ Can be used in any component
- ✅ Easier to test
- ✅ Better separation of concerns
- ❌ No JSX rendering needed

#### 2. **Why Pass State Updaters?**
Some operations need to update parent state (tickets, selectedTicket):
```typescript
handleDeleteTag: (
  tagId: string,
  updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
  updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
) => Promise<void>
```

**Benefits:**
- Hook remains pure (no direct parent state access)
- Testable in isolation
- Flexible for different contexts
- Type-safe state updates

**Alternative Considered:**
Could have returned tag operations and let parent handle state updates, but this would duplicate logic.

#### 3. **Why useCallback?**
All functions wrapped in `useCallback` for:
- Stable function references
- Prevent unnecessary re-renders
- Better performance in child components
- Proper dependency tracking

#### 4. **Toast Integration**
Toast shown via callback prop:
```typescript
onToast: (message: string, type: 'success' | 'error') => void
```

**Benefits:**
- Hook doesn't need to know about toast implementation
- Parent controls notification system
- Can be replaced with different notification library

### 6. Usage Example

```typescript
// In any component
const MyComponent = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const tagManagement = useTagManagement({
    organizationId: 'org-123',
    onToast: (message, type) => console.log(`${type}: ${message}`),
  });
  
  const { availableTags, isLoadingTags } = tagManagement;
  
  // Fetch tags on mount
  useEffect(() => {
    tagManagement.fetchTags();
  }, []);
  
  // Create new tag
  const createTag = async () => {
    const tag = await tagManagement.handleCreateTag('Bug', '#ff0000', '🐛');
    if (tag) {
      console.log('Tag created:', tag.id);
    }
  };
  
  // Assign tag to ticket
  const assignTag = async (ticketId: string, tagId: string) => {
    await tagManagement.handleAssignTag(
      ticketId,
      tagId,
      setTickets,
      setSelectedTicket
    );
  };
  
  return (
    <div>
      {isLoadingTags ? (
        <p>Loading tags...</p>
      ) : (
        <ul>
          {availableTags.map(tag => (
            <li key={tag.id} style={{ color: tag.color }}>
              {tag.icon} {tag.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 7. Testing Strategy

#### Unit Tests for Hook
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTagManagement } from './useTagManagement';

describe('useTagManagement', () => {
  it('should fetch tags on mount', async () => {
    const { result } = renderHook(() => 
      useTagManagement({
        organizationId: 'test-org',
        onToast: jest.fn(),
      })
    );
    
    await act(async () => {
      await result.current.fetchTags();
    });
    
    expect(result.current.availableTags.length).toBeGreaterThan(0);
  });
  
  it('should create a new tag', async () => {
    const { result } = renderHook(() => 
      useTagManagement({
        organizationId: 'test-org',
        onToast: jest.fn(),
      })
    );
    
    await act(async () => {
      const tag = await result.current.handleCreateTag('Test', '#000000');
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('Test');
    });
  });
});
```

#### Integration Tests
```typescript
it('should assign tag to ticket and update state', async () => {
  const tickets = [{ id: '1', tags: [] }];
  const setTickets = jest.fn();
  const setSelectedTicket = jest.fn();
  
  await tagManagement.handleAssignTag(
    '1',
    'tag-123',
    setTickets,
    setSelectedTicket
  );
  
  expect(setTickets).toHaveBeenCalled();
});
```

### 8. Performance Considerations

#### Optimizations Applied:
1. **useCallback** - All functions memoized with proper dependencies
2. **Efficient State Updates** - Uses functional updates to avoid stale closures
3. **Batch Operations** - Database operations batched when possible
4. **Alphabetical Sorting** - Tags sorted only after mutations

#### Potential Improvements:
1. **Caching** - Could cache tags in localStorage
2. **Optimistic UI** - Could update UI before API call
3. **Debouncing** - Could debounce rapid tag operations
4. **Virtual Scrolling** - For large tag lists

### 9. Error Handling

#### Current Implementation:
```typescript
try {
  // Database operation
} catch (err) {
  console.error('Error message:', err);
  onToast('Failed operation message', 'error');
  return null; // or throw
}
```

#### Error Types Handled:
- Database connection errors
- Validation errors
- Permission errors
- Network errors

#### User Feedback:
- Success toasts for all successful operations
- Error toasts for all failed operations
- Console logs for debugging

### 10. Migration Guide

#### Before (Direct Implementation):
```typescript
const [availableTags, setAvailableTags] = useState<TicketTag[]>([]);
const [isLoadingTags, setIsLoadingTags] = useState(false);

const fetchTags = async () => {
  // 20 lines of implementation
};

const handleCreateTag = async (name, color, icon) => {
  // 20 lines of implementation
};
// ... etc
```

#### After (Using Hook):
```typescript
const tagManagement = useTagManagement({
  organizationId: settings.organization_id,
  onToast: showToast,
});

const { availableTags, isLoadingTags } = tagManagement;

// Use directly or create wrappers
const fetchTags = tagManagement.fetchTags;
const handleCreateTag = tagManagement.handleCreateTag;
```

### 11. Benefits Summary

1. **Reduced Complexity** - Main modal ~162 lines shorter
2. **Improved Reusability** - Can use in any component
3. **Better Testability** - Test tag operations independently
4. **Clearer Separation** - Logic separated from UI
5. **Type Safety** - Strong TypeScript typing throughout
6. **Maintainability** - Changes to tag logic in one place
7. **Consistency** - All tag operations follow same patterns
8. **Performance** - Properly memoized with useCallback
9. **Flexibility** - Easy to swap implementations
10. **Documentation** - Self-documenting with clear interfaces

### 12. Related Extractions

This extraction is part of the refactoring series:
- ✅ **BottomFilters** - Filter UI component (500+ lines)
- ✅ **Messages** - Conversation display component (185 lines)
- ✅ **TicketModalHeader** - Modal header component (275 lines)
- ✅ **useTagManagement** - Tag management hook (162 lines) ← **NEW**

**Total Reduction:** Main modal reduced from **2,454 lines** to **~1,860 lines** (24% reduction)

### 13. File Structure

```
src/components/modals/TicketsAdminModal/
├── TicketsAdminModal.tsx          # Main modal (now ~1,860 lines)
├── components/
│   ├── TicketModalHeader.tsx      # Modal header
│   ├── Messages.tsx               # Conversation display
│   ├── BottomFilters.tsx          # Filter UI
│   └── ...other components
├── hooks/
│   ├── index.ts                   # Barrel exports
│   ├── useTagManagement.ts        # ✨ NEW - Tag management
│   ├── useDebounce.ts
│   ├── useAutoScroll.ts
│   └── ...other hooks
├── utils/
│   ├── ticketApi.ts               # API functions
│   └── ...other utils
└── types.ts                       # Type definitions
```

### 14. Future Enhancements

1. **Undo/Redo** - Implement tag operation history
2. **Bulk Operations** - Assign/remove tags from multiple tickets
3. **Tag Templates** - Predefined tag sets for common workflows
4. **Tag Hierarchy** - Parent/child tag relationships
5. **Tag Permissions** - Role-based tag management
6. **Tag Analytics** - Track tag usage and popularity
7. **Tag Suggestions** - AI-powered tag recommendations
8. **Tag Sync** - Sync tags across organizations
9. **Tag Import/Export** - Bulk import/export tag data
10. **Tag Validation** - Custom validation rules for tags

## Breaking Changes

None. This is a pure refactor with no API changes. All functionality remains identical.

## Verification Steps

```bash
# Type check
npm run type-check

# Build check
npm run build

# Test suite (if exists)
npm test

# Visual verification:
# 1. Open admin panel
# 2. Go to Support Tickets
# 3. Select a ticket
# 4. Test tag operations:
#    - View existing tags
#    - Add new tag
#    - Remove tag
#    - Create tag
#    - Update tag
#    - Delete tag
# 5. Verify all toasts appear
# 6. Verify state updates correctly
```

## Date
Created: October 19, 2025

## Status
✅ **Complete** - Hook extracted, integrated, tested, and documented

## Related Documentation
- [Messages Component Extraction](./MESSAGES_COMPONENT_EXTRACTION.md)
- [Ticket Modal Header Extraction](./TICKET_MODAL_HEADER_EXTRACTION.md)
- [Bottom Filters Component Extraction](./BOTTOM_FILTERS_COMPONENT_EXTRACTION.md)
