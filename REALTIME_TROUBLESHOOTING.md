# Realtime Troubleshooting Guide

## Changes Made

### 1. Admin Modal (`TicketsAdminModal.tsx`)
✅ Changed channel name from `'tickets'` to `'tickets-admin-channel'` (unique name)
✅ Added detailed console logging for all realtime events
✅ Added subscription status logging (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT)
✅ Fixed cleanup to unsubscribe from correct channel

### 2. Customer Modal (`TicketsAccountModal.tsx`)
✅ Changed channel name from `'customer-tickets'` to `'customer-tickets-channel'`
✅ Added detailed console logging
✅ Added subscription status logging
✅ Fixed cleanup

## Testing Instructions

### Step 1: Check Console Logs
1. Open your app and open the tickets modal (admin or customer)
2. Open browser DevTools Console (F12 → Console tab)
3. Look for these messages:

**Expected Success Messages:**
```
✅ Realtime subscription active for admin modal
```
or
```
✅ Realtime subscription active for customer modal
```

**Error Messages to Watch For:**
```
❌ Realtime subscription error: [details]
❌ Realtime subscription timed out
❌ Error setting up realtime subscription: [details]
```

### Step 2: Enable Realtime in Supabase (CRITICAL!)

**This is likely the issue!** Supabase Realtime must be explicitly enabled for each table.

1. **Go to Supabase SQL Editor**
2. **Copy and run this:**

```sql
-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_responses;

-- Verify it worked
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('tickets', 'ticket_responses');
```

3. **Expected result:** Should return 2 rows showing both tables

### Step 3: Verify in Dashboard
1. Go to **Database → Replication** in Supabase Dashboard
2. Find "supabase_realtime" publication
3. Verify these tables are listed:
   - ✅ tickets
   - ✅ ticket_responses

### Step 4: Test Real-time Updates

**Test Admin → Customer:**
1. Open **two browser windows** (or use incognito)
2. Window 1: Login as **customer**, open ticket modal, select a ticket
3. Window 2: Login as **admin**, open tickets modal, find same ticket
4. In Window 2 (admin): Add a response
5. **Expected:** Window 1 (customer) should show new response immediately
6. **Console should show:**
   ```
   ✅ Realtime (Customer): New admin response {data}
   ```

**Test Customer → Admin:**
1. Window 1: Customer view (keep open on a ticket)
2. Window 2: Admin view (keep open on same ticket)
3. In Window 1 (customer): Add a response
4. **Expected:** Window 2 (admin) should show new response
5. **Console should show:**
   ```
   ✅ Realtime: New response added {data}
   ```

**Test Status Changes:**
1. Window 1: Customer view (keep open on a ticket)
2. Window 2: Admin view (same ticket)
3. In Window 2 (admin): Change ticket status
4. **Expected:** Window 1 (customer) status badge updates
5. **Console should show:**
   ```
   ✅ Realtime: Ticket updated {data}
   ✅ Realtime (Customer): Ticket updated {data}
   ```

## Common Issues & Solutions

### Issue 1: "Realtime subscription timed out"
**Cause:** Tables not added to realtime publication
**Solution:** Run the SQL script in Step 2 above

### Issue 2: No console messages at all
**Cause:** Subscription not being created
**Solution:** 
- Check that modal is actually open (`isOpen === true`)
- Check for JavaScript errors in console
- Verify Supabase client is initialized

### Issue 3: "CHANNEL_ERROR"
**Cause:** Could be RLS policies blocking realtime
**Solution:**
```sql
-- Check RLS policies allow SELECT for authenticated users
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('tickets', 'ticket_responses')
AND cmd = 'SELECT';
```

### Issue 4: Realtime works but is slow
**Cause:** `fetchTickets()` refetches ALL tickets
**Solution:** This is current behavior - we refetch all tickets. Could be optimized later to update individual tickets.

### Issue 5: Multiple subscriptions stacking up
**Cause:** Not unsubscribing properly on modal close
**Solution:** Already fixed - cleanup function unsubscribes when `isOpen` changes

## Verification Checklist

Before reporting "realtime doesn't work", verify:

- [ ] Console shows "✅ Realtime subscription active"
- [ ] SQL query shows both tables in publication
- [ ] Dashboard shows tables under Replication
- [ ] Two browser windows open with different users
- [ ] Both users viewing the same ticket
- [ ] Action taken in one window (add response, change status)
- [ ] Console in other window shows realtime event
- [ ] Other window UI updates automatically

## Next Steps After Realtime Works

1. ✅ Status changes work
2. 🔄 Test realtime (you're here)
3. ⬜ Add assignment dropdown UI
4. ⬜ Add priority feature
5. ⬜ Address remaining 13 issues

## File Reference

- `verify_realtime_setup.sql` - SQL script to enable realtime
- `TicketsAdminModal.tsx` - Lines 121-148 (realtime setup)
- `TicketsAccountModal.tsx` - Lines 91-115 (realtime setup)
