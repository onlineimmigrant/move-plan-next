# Meeting Badge System - Debugging Guide

## Current Status

### ✅ What's Working
1. **"NEW" badges on meeting cards** - Correctly showing for unviewed meetings
2. **Admin unified menu badges** - Mostly working
3. **Code implementation** - All badge logic properly implemented

### ❌ What's Broken
1. **Customer meeting badges fail to render** on unified menu
2. **Admin cannot create meetings** for customers (both instant and calendar)

---

## Critical Issues & Solutions

### Issue #1: Missing Database Column ⚠️ **ACTION REQUIRED**

The `viewed_by` column doesn't exist in the `bookings` table yet!

**Fix:** Run this SQL in your Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/sql
2. Paste and run:

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS viewed_by JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN bookings.viewed_by IS 'Array of user IDs who have viewed this booking. Used for "NEW" badge functionality.';

CREATE INDEX IF NOT EXISTS idx_bookings_viewed_by ON bookings USING gin (viewed_by);
```

**Why this matters:** Without this column:
- All booking queries will fail with "column does not exist" errors
- Badge counts will always be 0
- Admin cannot create new meetings (INSERT fails)

---

### Issue #2: Enhanced Customer Badge Logic

**Fixed in:** `src/components/modals/UnifiedMenu/hooks/useUnreadMeetingsCount.ts`

**Changes made:**
- Added comprehensive logging with 🎬 emoji prefix
- Customer query now checks both `customer_id` AND `customer_email`
- Uses `{ count: 'exact' }` with data sample for debugging
- Logs show exactly which meetings are unviewed

**Debugging tips:**
1. Open browser console (F12)
2. Look for these logs:
   - `🎬 [useUnreadMeetingsCount] Fetching count for:` - Shows user info
   - `✅ Customer unviewed meetings:` - Shows count and sample data
   - `🔔 [useUnreadMeetingsCount] Booking changed:` - Real-time updates

---

## How to Test

### Test Customer Badges

1. **Apply the database migration first** (see Issue #1)

2. **Create a test meeting for a customer:**
   ```
   - Use admin account
   - Create instant meeting or calendar appointment
   - Specify customer email
   ```

3. **Check customer side:**
   - Log in as the customer
   - Open UnifiedMenu
   - Check browser console for logs
   - Badge should appear on "Appointments" menu item

4. **Verify "viewed" logic:**
   - Click on the meeting card
   - Badge should show "NEW" initially
   - After clicking, badge should disappear
   - Unified menu count should decrease

### Test Admin Meeting Creation

**Once migration is applied**, creating meetings should work:

1. **Instant Meeting:**
   ```
   Admin Dashboard → Meetings → Quick Invite
   - Fill customer email, name, title
   - Click "Send Invite"
   - Should create booking successfully
   ```

2. **Calendar Appointment:**
   ```
   Admin Dashboard → Calendar View
   - Click a time slot
   - Fill booking details
   - Click "Create Appointment"
   - Should create booking successfully
   ```

**If still fails after migration:**
- Check browser console for API errors
- Check Network tab for failed POST requests
- Look for 500 errors or constraint violations

---

## Technical Details

### Badge Count Query Logic

**Admin:**
```sql
SELECT COUNT(*) FROM bookings
WHERE organization_id = 'xxx'
AND NOT viewed_by @> '["admin_user_id"]'
```

**Customer:**
```sql
SELECT COUNT(*) FROM bookings
WHERE (customer_id = 'user_id' OR customer_email = 'user@email.com')
AND NOT viewed_by @> '["user_id"]'
```

### Real-time Updates

Three update mechanisms:
1. **Supabase Realtime** - Instant updates on booking changes
2. **Manual Events** - Triggered on modal close
3. **Polling Fallback** - Every 30 seconds

### Mark as Viewed Flow

1. User clicks meeting card
2. `markAsViewed()` function called
3. Updates `viewed_by` array: `[...existingViewedBy, currentUserId]`
4. Triggers `badge-refresh` event
5. All badge hooks refetch counts
6. UI updates immediately

---

## Files Modified

### Core Badge System
- ✅ `src/components/modals/UnifiedMenu/hooks/useUnreadMeetingsCount.ts` - Enhanced logging, fixed customer query
- ✅ `src/types/meetings.ts` - Added `viewed_by?: string[]` to Booking interface

### Database
- 📄 `add-viewed-by-to-bookings.sql` - Migration file (needs to be run)

### Previously Implemented (Working)
- ✅ `src/components/modals/UnifiedMenu/UnifiedMenu.tsx`
- ✅ `src/components/modals/UnifiedMenu/UnifiedModalManager.tsx`
- ✅ `src/components/modals/UnifiedMenu/hooks/useBadgeRefresh.ts`
- ✅ `src/components/modals/UnifiedMenu/menuItems.ts`
- ✅ `src/components/modals/MeetingsModals/shared/components/BookingCard/BookingCard.tsx`

---

## Next Steps

1. **CRITICAL:** Run the database migration (see Issue #1)
2. **Test:** Create a test meeting as admin for a customer
3. **Verify:** Check customer account for badge appearance
4. **Debug:** If issues persist, check console logs with 🎬 prefix
5. **Report:** Share any error messages from browser console or Network tab

---

## Console Log Reference

Look for these prefixes in browser console:

- `🎬 [useUnreadMeetingsCount]` - Badge count queries
- `✅` - Successful operations
- `❌` - Errors
- `🔔` - Real-time subscription events
- `⚠️` - Warnings or status messages

Example successful log sequence:
```
🎬 [useUnreadMeetingsCount] Fetching count for: { userId: "xxx", isAdmin: false, orgId: "xxx" }
✅ Customer unviewed meetings: { count: 2, sample: [...] }
✅ [useUnreadMeetingsCount] Realtime connected, channel: unread-meetings-badge-xxx-xxx
```
