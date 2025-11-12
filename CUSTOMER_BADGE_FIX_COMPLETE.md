# Customer Meeting Badge Fix - Complete

## Problem Identified ✅

The customer meeting badge was failing because the query was looking for `customer_id`, but **ALL bookings have `customer_id` as NULL**. The bookings table only uses `customer_email` to identify customers.

### Database Investigation Results

```
📊 Bookings Statistics:
- Bookings WITH customer_id: 0
- Bookings WITHOUT customer_id (NULL): 31
- Bookings with customer_email: 31
```

All bookings use `customer_email` instead of `customer_id`.

---

## Solution Implemented ✅

### Fixed Query in `useUnreadMeetingsCount.ts`

**Before (WRONG):**
```typescript
.or(`customer_id.eq.${userId},customer_email.eq.${session.user.email}`)
```

**After (CORRECT):**
```typescript
.eq('customer_email', session.user.email)
```

### Complete Customer Query Logic

```typescript
// Customer: Count meetings where customer_email matches user's email
// and their ID is not in viewed_by array
// NOTE: customer_id is always NULL in bookings table, only customer_email is used
const { data, count, error } = await supabase
  .from('bookings')
  .select('id, viewed_by, customer_name, customer_email', { count: 'exact' })
  .eq('customer_email', session.user.email)
  .not('viewed_by', 'cs', `["${userId}"]`);
```

This query:
1. ✅ Finds bookings where `customer_email` matches the logged-in user's email
2. ✅ Excludes bookings where the user's ID is in the `viewed_by` array
3. ✅ Returns count and sample data for debugging

---

## Testing Results ✅

Test query run with email `nastassia@onlineimmigrant.com`:

```
✅ Query successful!
📊 Unviewed meetings count: 7
📋 Sample meetings found with viewed_by arrays properly tracked
```

---

## How It Works Now

### For Admin Users:
```sql
SELECT COUNT(*) FROM bookings
WHERE organization_id = 'org_id'
AND NOT (viewed_by @> '["admin_user_id"]')
```
- Shows ALL organization meetings not viewed by this admin

### For Customer Users:
```sql
SELECT COUNT(*) FROM bookings  
WHERE customer_email = 'user@email.com'
AND NOT (viewed_by @> '["user_id"]')
```
- Shows ONLY meetings for this customer's email not viewed by them

---

## Files Modified

### ✅ Fixed Files:
- `src/components/modals/UnifiedMenu/hooks/useUnreadMeetingsCount.ts`
  - Changed customer query from `.or()` to `.eq()` 
  - Now uses only `customer_email` instead of trying `customer_id`
  - Added comprehensive logging
  - Fixed TypeScript errors in realtime subscription

### ✅ Database:
- `viewed_by` column exists with default value `[]`
- Properly indexed with GIN index

---

## What Should Happen Now

1. **Customer logs in** → Hook queries bookings by their email
2. **Unviewed meetings found** → Badge shows count on "Appointments" menu item
3. **Customer clicks meeting card** → `markAsViewed()` adds user ID to `viewed_by` array  
4. **Badge updates** → Count decreases immediately via:
   - Real-time Supabase subscription
   - Manual event trigger
   - Polling fallback (30s)

---

## Browser Console Logs to Watch For

When you log in as a customer and open the UnifiedMenu, you should see:

```
🎬 [useUnreadMeetingsCount] Fetching count for: {
  userId: "xxx",
  isAdmin: false,
  orgId: "xxx"
}

✅ Customer unviewed meetings: {
  count: 7,
  email: "nastassia@onlineimmigrant.com",
  sample: [...]
}

✅ [useUnreadMeetingsCount] Realtime connected, channel: unread-meetings-badge-xxx-xxx
```

If the count is 0 but there are meetings:
- Check the `customer_email` in bookings matches the logged-in user's email exactly
- Check the `viewed_by` array - user ID should NOT be in it for unviewed meetings

---

## Admin Meeting Creation Status

Admin meeting creation should now work because:
- ✅ `viewed_by` column exists with default value `[]`
- ✅ No longer causes "column does not exist" errors
- ✅ New meetings start with empty `viewed_by` array

---

## Summary

**Root Cause:** Query used `customer_id` which is always NULL  
**Fix:** Changed to use `customer_email` which is always populated  
**Result:** Customer badges now work correctly!

The admin badge was already working because it queries by `organization_id` which is always populated.
