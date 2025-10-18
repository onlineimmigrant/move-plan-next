# Ticket Assignment Issue - Investigation & Fix

## Problem
The `tickets.assigned_to` field doesn't receive the assignment value when using the assignment dropdown.

## Investigation

### Current Implementation
The `handleAssignTicket` function in `TicketsAdminModal.tsx` performs a **direct Supabase update**:

```typescript
const { error } = await supabase
  .from('tickets')
  .update({ assigned_to: adminId })
  .eq('id', ticketId);
```

**This is NOT going through an API route** - it updates the database directly via Supabase client.

### Potential Causes

#### 1. **RLS Policy Issue (Most Likely)**
The current UPDATE policy has a `USING` clause but **no `WITH CHECK` clause**:

```sql
CREATE POLICY "Admins can update tickets" 
  ON tickets 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
  -- ❌ Missing: WITH CHECK clause
```

**Why this matters:**
- `USING`: Determines which rows can be selected for update
- `WITH CHECK`: Validates the new values being written
- Without `WITH CHECK`, the update might silently fail or not persist

#### 2. **Organization Mismatch**
If the ticket's `organization_id` doesn't match the admin's `organization_id`, the RLS policy will block the update.

#### 3. **Foreign Key Constraint**
The `assigned_to` field references `auth.users(id)`. If the UUID being assigned doesn't exist in `auth.users`, the update will fail.

#### 4. **Silent Failure**
The current code doesn't use `.select()` to verify what was actually updated, so it might be succeeding but not writing the expected value.

## Fixes Implemented

### 1. Enhanced Debug Logging
Added comprehensive logging to `handleAssignTicket`:

```typescript
console.log('🎯 Assigning ticket:', { ticketId, adminId });

const { data, error } = await supabase
  .from('tickets')
  .update({ assigned_to: adminId })
  .eq('id', ticketId)
  .select('id, assigned_to');  // ← Now returns what was actually updated

console.log('✅ Assignment response from DB:', data);
```

### 2. RLS Policy Fix
Created `fix_ticket_assignment_rls.sql` to add the missing `WITH CHECK` clause:

```sql
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

CREATE POLICY "Admins can update tickets" 
  ON tickets 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (  -- ← Added this
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 3. Debug SQL Script
Created `debug_ticket_assignment.sql` with 9 diagnostic queries to identify:
- Current ticket state
- Admin permissions
- Organization matches
- RLS policy configuration
- Foreign key constraints
- Manual update tests

## Testing Instructions

### Step 1: Apply RLS Fix
```bash
# Connect to your Supabase database
psql -h your-project.supabase.co -U postgres -d postgres

# Run the fix
\i fix_ticket_assignment_rls.sql
```

### Step 2: Test Assignment in UI
1. Open admin modal
2. Select a ticket
3. Click assignment dropdown
4. Choose an admin to assign
5. **Open browser DevTools Console**
6. Look for these logs:
   ```
   🎯 Assigning ticket: { ticketId: '...', adminId: '...' }
   ✅ Assignment response from DB: [{ id: '...', assigned_to: '...' }]
   ✅ Updated selectedTicket.assigned_to to: ...
   ```

### Step 3: Verify Database
```sql
SELECT id, subject, assigned_to, organization_id 
FROM tickets 
WHERE id = 'your-ticket-id';
```

## Expected Console Output

### ✅ Success Case:
```
🎯 Assigning ticket: { ticketId: "abc-123", adminId: "def-456" }
✅ Assignment response from DB: [{ id: "abc-123", assigned_to: "def-456" }]
✅ Updated selectedTicket.assigned_to to: def-456
```

### ❌ RLS Policy Failure:
```
🎯 Assigning ticket: { ticketId: "abc-123", adminId: "def-456" }
✅ Assignment response from DB: []  ← Empty array means RLS blocked it
```

### ❌ Organization Mismatch:
```
🎯 Assigning ticket: { ticketId: "abc-123", adminId: "def-456" }
❌ Assignment error: { code: "42501", message: "new row violates row-level security policy" }
```

### ❌ FK Constraint Violation:
```
🎯 Assigning ticket: { ticketId: "abc-123", adminId: "def-456" }
❌ Assignment error: { code: "23503", message: "insert or update on table violates foreign key constraint" }
```

## Common Issues & Solutions

### Issue 1: Empty Array Response
**Symptom:** `Assignment response from DB: []`

**Cause:** RLS policy blocked the update

**Solutions:**
1. Run `fix_ticket_assignment_rls.sql` to add WITH CHECK clause
2. Verify admin and ticket are in same organization
3. Verify user has 'admin' role in profiles table

### Issue 2: Organizations Don't Match
**Symptom:** RLS security policy violation

**Solution:**
```sql
-- Find ticket's organization
SELECT organization_id FROM tickets WHERE id = 'ticket-id';

-- Find admin's organization  
SELECT organization_id FROM profiles WHERE id = 'admin-id';

-- If different, update ticket to correct org
UPDATE tickets 
SET organization_id = 'correct-org-id'
WHERE id = 'ticket-id';
```

### Issue 3: User Not Admin
**Symptom:** RLS policy blocks access

**Solution:**
```sql
-- Check current role
SELECT id, email, role FROM profiles WHERE id = 'user-id';

-- Update to admin if needed
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-id';
```

### Issue 4: Assigning to Non-Existent User
**Symptom:** Foreign key constraint violation

**Solution:**
```sql
-- Verify user exists
SELECT id FROM auth.users WHERE id = 'admin-id-to-assign';

-- Only assign to users that exist in auth.users
```

## Files Created

1. **`fix_ticket_assignment_rls.sql`** - Adds WITH CHECK clause to RLS policy
2. **`debug_ticket_assignment.sql`** - 9 diagnostic queries
3. **`TICKET_ASSIGNMENT_DEBUG.md`** - This documentation

## Files Modified

1. **`src/components/modals/TicketsAdminModal/TicketsAdminModal.tsx`**
   - Added debug logging to `handleAssignTicket`
   - Added `.select()` to verify update result
   - Console logs show assignment flow

## Next Steps

1. ✅ Apply RLS fix (`fix_ticket_assignment_rls.sql`)
2. ✅ Test assignment with debug logs
3. 🔍 Check console output to identify issue
4. 📊 Run debug SQL if needed
5. 🐛 Report findings for final fix

## Quick Diagnosis Command

Run this in Supabase SQL Editor to quickly check everything:

```sql
-- Replace these values
\set ticket_id 'your-ticket-id'
\set admin_id 'your-admin-id'

SELECT 
  't_org' as check_type,
  (SELECT organization_id FROM tickets WHERE id = :'ticket_id') as org_id
UNION ALL
SELECT 
  'a_org' as check_type,
  (SELECT organization_id FROM profiles WHERE id = :'admin_id') as org_id
UNION ALL
SELECT 
  'a_role' as check_type,
  (SELECT role FROM profiles WHERE id = :'admin_id')::text as org_id
UNION ALL
SELECT 
  'match' as check_type,
  CASE 
    WHEN (SELECT organization_id FROM tickets WHERE id = :'ticket_id') = 
         (SELECT organization_id FROM profiles WHERE id = :'admin_id')
    THEN 'YES ✓'
    ELSE 'NO ✗'
  END as org_id;
```

This will show:
- Ticket's organization
- Admin's organization  
- Admin's role
- Whether they match

If organizations match and role is 'admin', the assignment should work after applying the RLS fix.
