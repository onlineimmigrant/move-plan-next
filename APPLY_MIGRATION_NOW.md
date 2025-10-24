# ⚠️ CRITICAL: Database Migration Required ⚠️

## Current Issues

You're experiencing these errors:
1. ❌ **"Failed to fetch"** in InstantMeetingModal
2. ❌ **"Failed to fetch"** in WaitingRoomControls  
3. ❌ No email sent to customers
4. ❌ Meetings not showing in "My Meetings" list

## Root Cause

**The database migration has NOT been applied yet!**

The code is trying to:
- Set booking status to `'waiting'` (status doesn't exist in enum yet)
- Query bookings with `status = 'waiting'` (fails because enum value doesn't exist)
- Use columns like `waiting_since`, `approved_by`, etc. (columns don't exist yet)

## Required Action: Apply Migration NOW

### Step 1: Check if Migration is Needed

1. Open Supabase Dashboard → SQL Editor
2. Run this diagnostic query:

```sql
SELECT enumlabel as available_statuses
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'booking_status';
```

**If you see 'waiting' in the results:** ✅ Migration already applied, skip to Step 3

**If you DON'T see 'waiting':** ❌ Continue to Step 2

### Step 2: Apply the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the ENTIRE contents of this file:
   ```
   /migrations/add_waiting_status_to_bookings.sql
   ```

3. Paste into SQL Editor and click **RUN**

4. Wait for success message

### Step 3: Verify Migration Worked

Run this verification query:

```sql
-- Should return 6 rows
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('waiting_since', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'rejection_reason');
```

**Expected:** 6 rows returned
**If fewer rows:** Migration failed, check error messages

### Step 4: Restart Dev Server

After migration is applied:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Why This Fixes Everything

### 1. ✅ InstantMeetingModal will work
- Can create bookings with `status: 'confirmed'` (already exists)
- No longer tries to use 'waiting' status prematurely

### 2. ✅ WaitingRoomControls will work
- Can query `bookings WHERE status = 'waiting'` (now exists)
- Can use `waiting_since`, `approved_by`, etc. columns

### 3. ✅ Emails will be sent
- Booking creation succeeds → email sending code runs
- Check console for: "Sending meeting invitation email:"
- Check console for: "Invitation email sent successfully"

### 4. ✅ Meetings show in "My Meetings"
- Bookings are created successfully with `customer_email`
- MyBookingsList can fetch by `customer_email` parameter
- Filters show upcoming/in-progress meetings

## After Migration: Testing Checklist

### Test Instant Meeting Invite:

1. **Admin:** Open Meetings Modal → "Instant Meeting" button
2. Fill in form:
   - Meeting Type: (select one)
   - Customer Email: **use a real email you can check**
   - Customer Name: Test User
   - Title: Test Instant Meeting
   - Duration: 30 minutes
   - Notes: (optional)

3. Click "Send Invite"

4. **Check console** for:
   ```
   ✅ "Sending meeting invitation email:"
   ✅ "Invitation email sent successfully"
   ```

5. **Check email inbox** for invitation with join button

6. **Customer:** Click join link → should open `/account?openMeeting={id}`

7. **Customer:** Should see waiting room (dots animation)

8. **Admin:** Should see participant in "Waiting Participants" section

9. **Admin:** Click "Approve" → customer should enter video call

### Test My Meetings List:

1. **Customer:** Log in to account that received invitation
2. Click Meetings button → "My Meetings" tab
3. Should see instant meeting in list
4. Should have "Join Meeting" button (if within 15 min window)

## Troubleshooting

### Email not sending?

Check `.env` file has:
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Check console for email API errors:
```
Failed to send invitation email: 500 ...
```

### Meeting not in "My Meetings"?

1. Verify customer_email matches logged-in user email (exact match!)
2. Check browser console for API errors
3. Verify booking was created:
   ```sql
   SELECT id, title, customer_email, status, scheduled_at
   FROM bookings
   ORDER BY created_at DESC
   LIMIT 5;
   ```

### Waiting room not showing?

1. Check migration applied: `SELECT * FROM bookings WHERE status = 'waiting'`
2. Check console logs: Look for "🔍 Should enter waiting room?"
3. Check `isCustomer` and `isMeetingNotStarted` values in console

### Still having issues?

1. **Stop dev server** (Ctrl+C)
2. **Clear browser cache** and cookies
3. **Restart dev server**: `npm run dev`
4. **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
5. Check browser console and terminal for errors

## Quick Reference: File Locations

```
📁 /migrations/
  └─ add_waiting_status_to_bookings.sql    ← Apply this in Supabase

📁 /scripts/
  └─ check-waiting-room-migration.sql      ← Run to verify

📁 /src/app/api/meetings/
  ├─ instant-invite/route.ts               ← Creates instant meetings & sends email
  └─ waiting-room/
     ├─ enter/route.ts                     ← POST: Enter waiting, GET: List waiting
     ├─ approve/route.ts                   ← POST: Approve participant
     └─ reject/route.ts                    ← POST: Reject participant

📁 /src/components/modals/MeetingsModals/
  ├─ InstantMeetingModal.tsx               ← Send instant invite form
  ├─ WaitingRoom/
  │  ├─ WaitingRoom.tsx                    ← Customer waiting UI
  │  └─ WaitingRoomControls.tsx            ← Host approval controls
  └─ MeetingsBookingModal/
     └─ MyBookingsList.tsx                 ← Customer's meetings list
```

## Status After This Fix

- ✅ Database schema supports waiting room
- ✅ API endpoints can query waiting bookings
- ✅ Instant meetings can be created
- ✅ Emails can be sent successfully  
- ✅ Customers see meetings in "My Meetings"
- ✅ Waiting room displays properly
- ✅ Host can approve/reject participants

## Next Steps After Migration

Once migration is applied and everything works:

1. **Test complete flow** (instant meeting → email → waiting room → approval)
2. **Test scheduled meetings** (book future meeting → wait → waiting room)
3. **Enhanced Admin Controls** (view participants, end meeting, reschedule) - NOT YET IMPLEMENTED
