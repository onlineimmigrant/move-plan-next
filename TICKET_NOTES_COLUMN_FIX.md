# Ticket Notes Database Column Fix

## Issue
Console error when creating internal notes:
```
Error creating note: "Could not find the 'note' column of 'ticket_notes' in the schema cache"
```

## Root Cause
The code was using incorrect column names that didn't match the database schema:

### Database Schema (Correct)
```sql
create table public.ticket_notes (
  id uuid not null default gen_random_uuid (),
  ticket_id uuid not null,
  admin_id uuid not null,           -- Correct: admin_id
  note_text text not null,          -- Correct: note_text
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  is_pinned boolean null default false,
  ...
)
```

### Code (Incorrect)
The `saveInternalNote` function in `ticketApi.ts` was using:
- `note` instead of `note_text`
- `user_id` instead of `admin_id`
- `organization_id` (column doesn't exist in schema)

## Solution

### 1. Fixed `saveInternalNote` function

**Before:**
```typescript
// Create new note
const { error } = await supabase
  .from('ticket_notes')
  .insert({
    ticket_id: ticketId,
    note,                      // ❌ Wrong column name
    is_pinned: isPinned,
    user_id: userId,           // ❌ Wrong column name
    organization_id: organizationId, // ❌ Column doesn't exist
    created_at: getCurrentISOString()
  });
```

**After:**
```typescript
// Create new note
const { error } = await supabase
  .from('ticket_notes')
  .insert({
    ticket_id: ticketId,
    note_text: note,           // ✅ Correct column name
    is_pinned: isPinned,
    admin_id: userId,          // ✅ Correct column name
    created_at: getCurrentISOString()
  });
```

### 2. Fixed update operation

**Before:**
```typescript
// Update existing note
const { error } = await supabase
  .from('ticket_notes')
  .update({ 
    note,                      // ❌ Wrong column name
    is_pinned: isPinned,
    updated_at: getCurrentISOString()
  })
  .eq('id', noteId);
```

**After:**
```typescript
// Update existing note
const { error } = await supabase
  .from('ticket_notes')
  .update({ 
    note_text: note,           // ✅ Correct column name
    is_pinned: isPinned,
    updated_at: getCurrentISOString()
  })
  .eq('id', noteId);
```

### 3. Improved `fetchInternalNotes` function

**Before:**
```typescript
const { data: notesData, error: notesError } = await supabase
  .from('ticket_notes')
  .select(`
    *,
    user_profiles(full_name, email)  // ❌ Wrong table name
  `)
  .eq('ticket_id', ticketId)
  .order('created_at', { ascending: false });
```

**After:**
```typescript
// Fetch notes first
const { data: notesData, error: notesError } = await supabase
  .from('ticket_notes')
  .select(`*`)
  .eq('ticket_id', ticketId)
  .order('created_at', { ascending: false });

// Then fetch admin profiles separately
if (notesData && notesData.length > 0) {
  const adminIds = [...new Set(notesData.map(note => note.admin_id))];
  
  const { data: profiles } = await supabase
    .from('profiles')  // ✅ Correct table name
    .select('id, full_name, email')
    .in('id', adminIds);

  // Map admin details to notes
  const notesWithAdminDetails = notesData.map(note => {
    const profile = profiles?.find(p => p.id === note.admin_id);
    return {
      ...note,
      admin_email: profile?.email,
      admin_full_name: profile?.full_name
    };
  });

  return notesWithAdminDetails;
}
```

## Changes Made

### File: `/src/components/modals/TicketsAdminModal/utils/ticketApi.ts`

1. **Line ~655**: Changed `note` to `note_text` in update operation
2. **Line ~672**: Changed `note` to `note_text` in insert operation
3. **Line ~673**: Changed `user_id` to `admin_id`
4. **Line ~674**: Removed `organization_id` field (doesn't exist in schema)
5. **Lines ~238-276**: Rewrote `fetchInternalNotes` to properly fetch admin profiles

## Verification

✅ TypeScript compilation: No errors  
✅ Column names match database schema  
✅ Foreign key references correct (`admin_id` → `auth.users`)  
✅ All CRUD operations use correct column names

## Testing Checklist

- [ ] Create a new internal note
- [ ] Update an existing note
- [ ] Pin/unpin a note
- [ ] Delete a note
- [ ] Verify admin name and email display correctly
- [ ] Check that notes are associated with correct ticket
- [ ] Verify pinned notes appear in banner

## Database Schema Reference

```sql
-- Columns in ticket_notes table:
id              uuid (PK)
ticket_id       uuid (FK → tickets)
admin_id        uuid (FK → auth.users)
note_text       text
created_at      timestamp with time zone
updated_at      timestamp with time zone
is_pinned       boolean
```

---

**Date**: October 19, 2025  
**Status**: ✅ Fixed  
**Files Changed**: 1 (`ticketApi.ts`)
