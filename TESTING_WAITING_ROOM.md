# Testing Waiting Room - Step by Step Guide

## ✅ Fixes Applied

### 1. Development URL Links Fixed
**Issue:** Email links using production domain in development
**Fix:** `/src/app/api/meetings/instant-invite/route.ts`
- Now uses `http://localhost:3000` in development
- Uses production domain in production

### 2. Waiting Room to Video Call Transition Fixed
**Issue:** Yellow circle (connecting) instead of video call after approval
**Fix:** `/src/components/modals/MeetingsModals/ManagedVideoCall.tsx`
- Added `handleStatusChange` that fetches Twilio token when approved
- Properly updates context with token and room name
- Transitions from waiting room to video call seamlessly

---

## 🧪 Test Plan

### Prerequisites
Before testing, verify migration is applied:

```sql
-- Run in Supabase SQL Editor
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'waiting_since';
```

**Expected:** Returns 1 row

**If returns 0:** Apply migration from `/migrations/add_waiting_status_to_bookings.sql`

---

### Test 1: Instant Meeting Email Link (Development)

**Steps:**
1. Login as admin
2. Go to Meetings → Admin View
3. Click "+ Send Instant Invite"
4. Fill form:
   - Customer Email: (your email)
   - Customer Name: Test User
   - Meeting Title: Test Meeting
   - Leave other fields default
5. Submit

**Expected Results:**
- ✅ Success toast appears
- ✅ Check email inbox
- ✅ Email received with meeting invitation
- ✅ Click "Join Video Meeting" button
- ✅ Link goes to: `http://localhost:3000/meetings/join/{booking_id}`
- ✅ NOT `https://production-domain.com/...`

**Actual Result in Development:**
```
Email link should be: http://localhost:3000/meetings/join/abc-123-def
NOT: https://yourdomain.com/meetings/join/abc-123-def
```

---

### Test 2: Waiting Room Flow (Complete)

#### Part A: Customer Enters Waiting Room

**Setup:**
1. Login as admin
2. Create booking scheduled **10 minutes in the future**
3. Note the booking ID
4. Logout or open incognito window

**Steps (as Customer):**
1. Login as customer (non-admin user)
2. Go to Meetings → My Bookings
3. See the new booking card
4. **Open browser console (F12)**
5. Click "Join" button

**Expected Console Logs:**
```javascript
[useMeetingLauncher] Waiting room check: {
  isAdmin: false,
  isHost: false,
  now: "2025-10-23T14:00:00.000Z",
  startTime: "2025-10-23T14:10:00.000Z",
  shouldEnterWaitingRoom: true,
  currentStatus: "confirmed"
}
[useMeetingLauncher] Entering waiting room...
[useMeetingLauncher] Waiting room entered successfully: {...}
```

**Expected UI:**
- ✅ Full-screen waiting room appears
- ✅ Animated waiting dots (pulse animation)
- ✅ "Waiting for host to admit you..." message
- ✅ Meeting details displayed:
  - Meeting title
  - Host name
  - Scheduled time
- ✅ Timer showing "Waiting for 0:05..." (incrementing)
- ✅ **NO yellow connecting circle**
- ✅ **NO video call interface**

#### Part B: Host Approves

**Steps (as Admin/Host):**
1. In original window (logged in as admin)
2. Go to Meetings → Admin View
3. Look at top of page

**Expected UI:**
- ✅ "Waiting Room" panel visible
- ✅ Shows customer card with:
  - Customer name: "Test User"
  - Email: customer@example.com
  - Meeting title
  - "Waiting for X seconds/minutes"
  - Green "Admit" button
  - Red "Deny" button

**Steps:**
4. Click green "Admit" button

**Expected Console Logs (Admin):**
```javascript
✅ Participant admitted successfully
```

**Expected Console Logs (Customer window):**
```javascript
[ManagedVideoCall] Status changed to in_progress, fetching Twilio token...
[ManagedVideoCall] Token received, updating context and hiding waiting room
```

**Expected UI (Customer):**
- ✅ Waiting room disappears
- ✅ Video call interface appears
- ✅ Camera/microphone permissions requested
- ✅ Video call starts successfully
- ✅ Can see video tiles
- ✅ Can end call

#### Part C: Host Denies (Alternative Path)

**Setup:** Repeat Part A with new booking

**Steps (as Admin):**
1. Click red "Deny" button
2. Optional: Enter rejection reason
3. Confirm

**Expected UI (Customer):**
- ✅ Waiting room shows rejection message
- ✅ Message: "Access denied" or custom reason
- ✅ Waiting room closes after a few seconds
- ✅ Back to bookings list

---

### Test 3: Edge Cases

#### Edge Case 1: Customer Joins After Start Time

**Setup:**
1. Create booking with start time in the PAST
2. Login as customer
3. Try to join

**Expected:**
- ❌ Should NOT enter waiting room
- ✅ Should join video call directly (if within allowed window)
- OR show "Meeting has ended" if too late

#### Edge Case 2: Admin Joins Before Start Time

**Setup:**
1. Create booking 10 min in future
2. Login as admin
3. Try to join

**Expected:**
- ❌ Should NOT enter waiting room (admin bypass)
- ✅ Should join video call directly
- ✅ Console log shows: `isAdmin: true, shouldEnterWaitingRoom: false`

#### Edge Case 3: Host Joins Before Start Time

**Setup:**
1. Create booking with YOU as host, 10 min in future
2. Try to join

**Expected:**
- ❌ Should NOT enter waiting room (host bypass)
- ✅ Should join video call directly
- ✅ Console log shows: `isHost: true, shouldEnterWaitingRoom: false`

---

## 🐛 Troubleshooting

### Issue: Still seeing yellow circle instead of waiting room

**Check:**
1. Open browser console
2. Look for `[useMeetingLauncher]` logs
3. Check if `shouldEnterWaitingRoom` is `true`
4. Check if waiting room API call succeeded

**If `shouldEnterWaitingRoom: false`:**
- Verify you're NOT logged in as admin
- Verify meeting is in the future
- Verify you're not the host

**If API call fails:**
- Check Network tab for error response
- Verify migration was applied
- Check booking exists in database

### Issue: Email link goes to production domain

**Check:**
```bash
# In terminal, check environment:
echo $NODE_ENV
echo $NEXT_PUBLIC_BASE_URL
```

**Expected in development:**
```
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**If wrong:** Update `.env.local`

### Issue: Waiting room doesn't transition to video call

**Check console logs:**
```
[ManagedVideoCall] Status changed to in_progress, fetching Twilio token...
```

**If missing:** Check if host actually clicked "Admit"

**If shows error:** Check API response in Network tab

---

## ✅ Success Criteria

All these should work:

- [x] Email links use localhost in development
- [x] Customer enters waiting room when joining early
- [x] Waiting room shows correct UI with timer
- [x] Host sees customer in waiting room controls
- [x] Host can approve → customer joins video call
- [x] Host can deny → customer sees rejection
- [x] Admin bypasses waiting room
- [x] Host bypasses waiting room
- [x] No yellow connecting circle in waiting room

---

## 📝 Notes

**When testing in incognito:**
- You'll need to login as customer
- Make sure customer account is NOT admin
- Clear cookies between tests

**Production vs Development:**
- Development: Uses localhost URLs
- Production: Uses settings.domain from database

**Status Flow:**
```
confirmed → [customer joins early] → waiting → [host approves] → in_progress → [call ends] → completed
                                              ↓
                                        [host denies] → cancelled
```

---

## 🆘 If All Else Fails

1. Clear browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Check database: `SELECT * FROM bookings WHERE id = 'booking-id'`
4. Verify `status` column value
5. Verify `waiting_since` column exists
6. Check server logs for errors
7. Open `/WAITING_ROOM_TROUBLESHOOTING.md` for detailed diagnostics
