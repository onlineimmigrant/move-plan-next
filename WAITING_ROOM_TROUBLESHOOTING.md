# Waiting Room Troubleshooting Guide

## Issue: Waiting Room Not Showing

### Root Causes
1. **Database migration not applied** (most likely)
2. **Timing conditions not met**
3. **User role issues**

---

## Step 1: Verify Database Migration ✅

### Quick Check
Run this in **Supabase Dashboard → SQL Editor**:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'waiting_since';
```

**Expected Result:**
- Returns 1 row: `waiting_since`

**If returns 0 rows:**
- Migration NOT applied → See "Apply Migration" below

### Apply Migration

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy ALL contents from: `/migrations/add_waiting_status_to_bookings.sql`
5. Paste into editor
6. Click **Run**
7. Verify with the diagnostic script: `/scripts/check-waiting-room-migration.sql`

---

## Step 2: Test Waiting Room Flow

### Requirements for Waiting Room to Show

Customer must meet ALL these conditions:
- ✅ Not an admin
- ✅ Not the host of the meeting
- ✅ Joining BEFORE the scheduled meeting time

### Test Scenario

1. **Create a test booking:**
   - Scheduled for 10 minutes in the future
   - Note the booking ID

2. **Join as customer (non-admin):**
   - Open browser console (F12)
   - Navigate to: `/meetings/join/{booking_id}`
   - Look for console log: `[useMeetingLauncher] Waiting room check:`

3. **Expected console output:**
```javascript
[useMeetingLauncher] Waiting room check: {
  isAdmin: false,
  isHost: false,
  now: "2025-10-23T10:00:00.000Z",
  startTime: "2025-10-23T10:10:00.000Z",
  shouldEnterWaitingRoom: true,
  currentStatus: "confirmed"
}
[useMeetingLauncher] Entering waiting room...
[useMeetingLauncher] Waiting room entered successfully: { ... }
```

4. **Expected UI:**
   - Waiting room screen with animated dots
   - "Waiting for host..." message
   - Meeting details displayed
   - Timer showing how long waiting

---

## Step 3: Test Host Approval

1. **Open admin panel:**
   - Log in as admin
   - Go to Meetings → Admin View

2. **Check waiting room controls:**
   - Should see "Waiting Room" panel at top
   - Should show the customer waiting
   - Customer card shows: name, email, meeting title, waiting time

3. **Approve customer:**
   - Click green "Admit" button
   - Customer should transition to video call

---

## Common Issues & Solutions

### Issue: "Failed to enter waiting room"

**Check console for error details:**

**Possible causes:**
1. Migration not applied
2. Booking not found
3. Authentication issue

**Solution:**
```bash
# In browser console, check:
localStorage.getItem('supabase.auth.token')
# Should have valid JWT token
```

### Issue: Customer goes straight to video call

**This is expected if:**
- Customer is an admin
- Customer is the host
- Meeting time has already started or passed

**To test waiting room:**
- Use non-admin account
- Book meeting for future time
- Join before scheduled time

### Issue: "Failed to update booking status"

**This was a bug - now fixed!**

The error was trying to use PATCH on `/api/meetings/bookings` but that endpoint only supports PUT.

**Fixed in:** `/src/components/modals/MeetingsModals/ManagedVideoCall.tsx`
- Changed from: `PATCH /api/meetings/bookings`
- Changed to: `PUT /api/meetings/bookings/{id}`

---

## Debug Checklist

Run through this checklist to diagnose issues:

- [ ] Database migration applied (run diagnostic SQL)
- [ ] Browser console shows `[useMeetingLauncher]` logs
- [ ] Test meeting is scheduled in the future
- [ ] Test user is NOT admin
- [ ] Test user is NOT host
- [ ] Supabase auth session is valid
- [ ] Network tab shows waiting-room API call
- [ ] API returns success response

---

## Files Modified (Latest)

### Fixed Issues:
1. ✅ **ManagedVideoCall.tsx** - Fixed status update endpoint (PATCH → PUT)
2. ✅ **ManagedVideoCall.tsx** - Added better logging for missing token
3. ✅ **useMeetingLauncher.ts** - Added detailed waiting room logs
4. ✅ **AdminBookingsList.tsx** - Fixed React Hooks order violation
5. ✅ **BookingForm.tsx** - Improved validation logging

---

## Next Steps

1. **Apply migration first!** (Step 1 above)
2. Open browser console and test waiting room
3. Check console logs match expected output
4. Test host approval from admin panel
5. Report back with console logs if still not working

---

## Quick Test Command

To quickly test if everything is working:

1. Create booking 5 min in future
2. Copy booking ID
3. Open in new incognito window (as customer)
4. Navigate to: `http://localhost:3000/meetings/join/{booking_id}`
5. Check console - should enter waiting room
6. In original window (as admin) - approve from admin panel
7. Customer should see video call start

---

## Support Files

- Migration SQL: `/migrations/add_waiting_status_to_bookings.sql`
- Diagnostic script: `/scripts/check-waiting-room-migration.sql`
- Full documentation: `/docs/WAITING_ROOM_AND_INSTANT_MEETINGS_COMPLETE.md`
- Quick reference: `/QUICK_REFERENCE.md`
