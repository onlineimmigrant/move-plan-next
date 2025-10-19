# Database/API Functions Extraction - In Progress 🚧

## Overview
Extracting all database and API interaction functions from `TicketsAdminModal.tsx` into a dedicated service file for better code organization and reusability.

## Progress Summary

### Phase Status
- ✅ **Created**: `utils/ticketApi.ts` (708 lines)
- ✅ **Imported**: API module into main component
- 🔄 **Replacing**: Functions in main component (4 of ~20 replaced)
- ⏳ **Remaining**: ~16 more functions to replace

### Current Metrics
- **Main Component**: 
  - Before: 3,418 lines
  - Current: 3,304 lines
  - **Reduction so far**: 114 lines (3.3%)
- **API Service**: 708 lines (new file)
- **Functions Extracted**: 4/20

## Created: ticketApi.ts

### Structure
```typescript
// ============================================================================
// FETCH FUNCTIONS - Data retrieval operations (9 functions)
// ============================================================================
- fetchTickets()
- fetchAvatars()
- fetchAdminUsers()
- fetchCurrentUser()
- fetchTags()
- fetchPredefinedResponses()
- fetchInternalNotes()
- fetchTicketsWithPinnedNotes()
- fetchTicketNoteCounts()
- refreshSelectedTicket()

// ============================================================================
// MUTATION FUNCTIONS - Data modification operations (11 functions)
// ============================================================================
- markMessagesAsRead()
- updateTicketStatus()
- assignTicket()
- updateTicketPriority()
- addTagToTicket()
- removeTagFromTicket()
- sendAdminResponse()
- saveInternalNote()
- deleteInternalNote()
- toggleNotePin()
- deleteTicketResponse()

// ============================================================================
// REALTIME FUNCTIONS - Subscription and channel management (1 function)
// ============================================================================
- setupRealtimeSubscription()

// ============================================================================
// ATTACHMENT FUNCTIONS - File handling (1 function)
// ============================================================================
- loadAttachmentUrls()
```

## Functions Replaced (4/20)

### ✅ 1. fetchTickets
**Before** (~111 lines of Supabase queries, data processing, tag fetching):
```typescript
const fetchTickets = async (loadMore: boolean = false) => {
  if (!loadMore) setIsLoadingTickets(true);
  try {
    const startIndex = loadMore ? tickets.length : 0;
    const fetchCount = ticketsPerPage * 3;
    
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(/* long query */)
      .eq('organization_id', settings.organization_id)
      // ... 50+ more lines of processing
```

**After** (~30 lines - clean API call):
```typescript
const fetchTickets = async (loadMore: boolean = false) => {
  if (!loadMore) setIsLoadingTickets(true);
  try {
    const result = await TicketAPI.fetchTickets({
      loadMore,
      currentTickets: tickets,
      ticketsPerPage,
      organizationId: settings?.organization_id
    });
    // ... simple state updates
```
**Savings**: ~81 lines

### ✅ 2. fetchAvatars
**Before** (~52 lines with error handling, localStorage logic):
```typescript
const fetchAvatars = async () => {
  try {
    const { data, error } = await supabase
      .from('ticket_avatars')
      .select('id, title, full_name, image')
      .eq('organization_id', settings.organization_id)
      // ... 40+ lines of fallback logic
```

**After** (~25 lines - focused on state management):
```typescript
const fetchAvatars = async () => {
  try {
    const avatarData = await TicketAPI.fetchAvatars(settings?.organization_id);
    const avatarList = [/* default */, ...avatarData];
    setAvatars(avatarList);
    // ... state management only
```
**Savings**: ~27 lines

### ✅ 3. fetchAdminUsers
**Before** (~19 lines):
```typescript
const fetchAdminUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('organization_id', settings.organization_id)
      .eq('role', 'admin')
      .order('full_name', { ascending: true });
    // ... error handling
```

**After** (~7 lines):
```typescript
const fetchAdminUsers = async () => {
  try {
    const users = await TicketAPI.fetchAdminUsers(settings?.organization_id);
    setAdminUsers(users);
  } catch (err) { /* ... */ }
};
```
**Savings**: ~12 lines

### ✅ 4. fetchCurrentUser
**Before** (~9 lines):
```typescript
const fetchCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  } catch (err) { /* ... */ }
};
```

**After** (~8 lines - slightly more readable):
```typescript
const fetchCurrentUser = async () => {
  try {
    const user = await TicketAPI.fetchCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  } catch (err) { /* ... */ }
};
```
**Savings**: ~1 line

## Remaining Functions to Replace (~16)

### Fetch Functions (5 remaining)
- [ ] fetchTags
- [ ] fetchPredefinedResponses  
- [ ] fetchInternalNotes
- [ ] fetchTicketsWithPinnedNotes
- [ ] fetchTicketNoteCounts

### Mutation Functions (8 remaining)
- [ ] handleAssignTicket
- [ ] handlePriorityChange
- [ ] handleAdminRespond
- [ ] handleStatusChange / executeStatusChange
- [ ] handleAddTag (if exists)
- [ ] handleRemoveTag
- [ ] (Note-related handlers)
- [ ] (Response deletion)

### Utility Functions (3 remaining)
- [ ] refreshSelectedTicket
- [ ] setupRealtimeSubscription
- [ ] loadAttachmentUrls

## Benefits

### Already Achieved ✅
1. **Separation of Concerns** - Database logic separated from UI component
2. **Reusability** - API functions can be used in other components
3. **Testability** - API functions can be tested independently
4. **Type Safety** - All functions properly typed
5. **Maintainability** - Easier to modify database queries in one place

### Expected After Completion
- **Line Reduction**: Estimated 400-500 lines from main component
- **Final Component Size**: ~2,900-3,000 lines (from original 3,907)
- **Cumulative Reduction**: ~900-1,000 lines total (23-26%)
- **API Service**: Complete, reusable, testable

## Implementation Strategy

### API Function Design
Each API function:
1. **Accepts parameters** - No direct access to component state
2. **Returns data** - Component handles state updates
3. **Throws errors** - Component handles error states
4. **Pure logic** - No side effects except DB operations

### Example Pattern
```typescript
// In ticketApi.ts
export async function fetchSomething(params) {
  try {
    const { data, error } = await supabase...
    if (error) throw error;
    return processedData;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

// In component
const fetchSomething = async () => {
  try {
    const result = await TicketAPI.fetchSomething(params);
    setState(result); // Component manages state
  } catch (err) {
    setToast({ message: 'Error', type: 'error' }); // Component handles UI
  }
};
```

## Next Steps

1. ✅ Create ticketApi.ts with all 22 functions
2. ✅ Import API module into main component
3. ✅ Replace fetchTickets, fetchAvatars, fetchAdminUsers, fetchCurrentUser
4. ⏳ Replace remaining 16 functions
5. ⏳ Test all functionality
6. ⏳ Measure final line count
7. ⏳ Update documentation

## TypeScript Status
- ✅ Main Component: 0 errors
- ✅ API Service: 0 errors
- ✅ Build: Passing

---

**Status**: 🔄 **IN PROGRESS** (4/20 functions replaced)  
**Current Reduction**: 114 lines (3.3%)  
**Expected Total**: ~500 lines (12-15%)  
**Date**: January 2025
