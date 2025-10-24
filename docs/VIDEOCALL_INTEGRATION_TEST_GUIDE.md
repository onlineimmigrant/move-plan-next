# VideoCall Integration - Test Guide

## ✅ Integration Complete!

The VideoCall + Meetings system has been fully integrated into your app.

---

## 🔧 What Was Done

### 1. **MeetingProvider Added to ClientProviders**
- Wrapped the entire app with `<MeetingProvider>`
- Added `<ManagedVideoCall />` component at root level (z-index 2000)
- Positioned above all other modals for proper rendering

### 2. **MeetingsBookingModal Updated**
- Added tab navigation: **"My Meetings"** | **"Book New Meeting"**
- Integrated `<MyBookingsList />` component in "My Meetings" tab
- Updated modal titles and subtitles to reflect current tab/view
- Tabs hidden during booking form flow (better UX)

### 3. **Zero TypeScript Errors**
All 5 modified/created files compile successfully:
- ✅ `/src/app/ClientProviders.tsx`
- ✅ `/src/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal.tsx`
- ✅ `/src/context/MeetingContext.tsx`
- ✅ `/src/components/modals/MeetingsModals/ManagedVideoCall.tsx`
- ✅ `/src/components/modals/MeetingsModals/MeetingsBookingModal/MyBookingsList.tsx`

---

## 🧪 Testing Checklist

### Prerequisites
- [x] Twilio credentials in `.env.local`:
  ```bash
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_API_SECRET=your-secret-here
  ```
- [ ] Dev server running: `npm run dev`
- [ ] User authenticated (logged in)
- [ ] Organization has at least one meeting type configured

---

### Test 1: View Existing Bookings
1. Open Meetings modal (via button/link in your app)
2. Should land on **"My Meetings"** tab by default
3. Verify bookings list appears (or "No upcoming meetings" message)
4. Check status badges display correctly:
   - 🟢 Confirmed (green)
   - 🔵 In Progress (blue)
   - ⚪ Completed (gray)

**Expected**: List of bookings with proper formatting and status

---

### Test 2: Create New Booking
1. Click **"Book New Meeting"** tab
2. Calendar view should appear
3. Click on available time slot
4. Fill out booking form (email should be pre-filled)
5. Submit booking
6. Should return to "My Meetings" tab
7. New booking should appear in list

**Expected**: Booking created and visible in "My Meetings"

---

### Test 3: Join Video Call (15-Minute Window)
**Setup**: Create booking that starts within 15 minutes OR manually adjust booking time in database:

```sql
-- Adjust booking to start in 5 minutes (for testing)
UPDATE bookings 
SET start_time = NOW() + INTERVAL '5 minutes',
    end_time = NOW() + INTERVAL '35 minutes'
WHERE id = 'your-booking-uuid';
```

**Test Steps**:
1. Go to "My Meetings" tab
2. Find the upcoming booking
3. "Join Video Call" button should be **enabled**
4. Click "Join Video Call"
5. Video call modal should appear at z-index 2000
6. Verify Twilio video connection works
7. Check booking status updates to `in_progress` (check DB or refresh list)

**Expected**: 
- Button enabled 15 min before start
- Video call launches successfully
- Status updates to "In Progress"

---

### Test 4: Join Window Validation
**Setup**: Create booking that starts > 15 minutes in future

**Test Steps**:
1. Go to "My Meetings" tab
2. Find the future booking
3. "Join Video Call" button should be **disabled**
4. Tooltip/message should indicate: "Available 15 minutes before start"

**Expected**: Button disabled with helpful message

---

### Test 5: Admin Can Join Anytime
**Setup**: User with admin role

**Test Steps**:
1. Create booking at any time in future
2. Go to "My Meetings"
3. Admins should see enabled "Join Video Call" button regardless of time
4. Click to launch video call

**Expected**: Admins bypass 15-minute restriction

---

### Test 6: Token Auto-Refresh (Long Meetings)
**Setup**: Join a meeting and stay connected > 50 minutes

**Test Steps**:
1. Join video call
2. Wait 50 minutes (or manually trigger refresh)
3. Check browser console for refresh logs
4. Verify connection doesn't drop

**Expected**: 
- Automatic token refresh at 50-minute mark
- No disconnection during long meetings
- Console log: "Token refreshed successfully"

---

### Test 7: Leave Meeting Updates Status
**Test Steps**:
1. Join video call (status: `in_progress`)
2. Click "Leave" or close video modal
3. Refresh bookings list
4. Status should update to `completed`

**Expected**: Status changes from "In Progress" → "Completed"

---

### Test 8: Multiple Participants
**Setup**: Two users join same meeting

**Test Steps**:
1. User A creates booking, shares booking ID
2. User B navigates to same booking (admin or participant)
3. Both click "Join Video Call" within 15 minutes of start
4. Both should enter same Twilio room
5. Verify video/audio connection

**Expected**: Multiple users in same room successfully

---

### Test 9: Past Meetings Don't Show Join Button
**Setup**: Create booking in the past

```sql
UPDATE bookings 
SET start_time = NOW() - INTERVAL '2 hours',
    end_time = NOW() - INTERVAL '1 hour',
    status = 'completed'
WHERE id = 'your-booking-uuid';
```

**Test Steps**:
1. Refresh "My Meetings" tab
2. Past meeting should appear
3. "Join Video Call" button should NOT be visible
4. Only "Completed" status badge shown

**Expected**: No join button for past meetings

---

### Test 10: Error Handling
**Test Invalid Booking**:
1. Manually call launch API with fake booking ID:
   ```javascript
   const { launchFromBooking } = useMeetingLauncher();
   await launchFromBooking({ bookingId: 'fake-uuid' });
   ```
2. Should show error toast/message
3. Video call should NOT open

**Expected**: Graceful error handling with user feedback

**Test Missing Twilio Credentials**:
1. Remove Twilio env vars temporarily
2. Try to join meeting
3. Should see error: "Video service configuration error"

**Expected**: Clear error message, no crash

---

## 🐛 Common Issues & Fixes

### Issue: "Join Video Call" always disabled
**Cause**: Booking time in past OR more than 15 min in future

**Fix**: 
```sql
-- Check booking time
SELECT id, start_time, end_time, status 
FROM bookings 
WHERE customer_email = 'your-email@example.com';

-- Adjust to near-future time
UPDATE bookings 
SET start_time = NOW() + INTERVAL '5 minutes',
    end_time = NOW() + INTERVAL '35 minutes'
WHERE id = 'your-booking-uuid';
```

---

### Issue: Video call doesn't open
**Cause**: Missing Twilio credentials or invalid token

**Fix**:
1. Check `.env.local` has all 3 Twilio variables
2. Restart dev server after adding env vars
3. Check browser console for errors
4. Verify Twilio account is active

---

### Issue: "My Meetings" tab is empty
**Cause**: No bookings exist OR wrong organization_id

**Fix**:
```sql
-- Check bookings for current user
SELECT * FROM bookings 
WHERE customer_email = 'your-email@example.com'
AND start_time > NOW();

-- Verify organization matches
SELECT organization_id FROM profiles 
WHERE email = 'your-email@example.com';
```

---

### Issue: Token refresh fails after 50 minutes
**Cause**: Booking no longer exists OR session expired

**Fix**:
- Check booking still exists in database
- Verify user is still authenticated
- Check browser console for specific error
- Ensure booking status is still `in_progress`

---

### Issue: Multiple users can't join same room
**Cause**: Incorrect room name generation OR access control bug

**Fix**:
1. Check room name in both users' consoles
2. Verify both use same booking ID
3. Check Twilio console for active rooms
4. Ensure both have valid tokens

---

## 🎯 Database Queries for Testing

### View All Upcoming Meetings
```sql
SELECT 
  b.id,
  b.customer_email,
  b.customer_name,
  b.start_time,
  b.end_time,
  b.status,
  mt.name as meeting_type
FROM bookings b
JOIN meeting_types mt ON b.meeting_type_id = mt.id
WHERE b.start_time > NOW()
ORDER BY b.start_time ASC;
```

### Check Meeting Status
```sql
SELECT id, status, start_time, end_time
FROM bookings
WHERE id = 'your-booking-uuid';
```

### Create Test Booking (5 minutes from now)
```sql
INSERT INTO bookings (
  id,
  organization_id,
  meeting_type_id,
  customer_email,
  customer_name,
  start_time,
  end_time,
  status
) VALUES (
  gen_random_uuid(),
  'your-org-id',
  'your-meeting-type-id',
  'test@example.com',
  'Test User',
  NOW() + INTERVAL '5 minutes',
  NOW() + INTERVAL '35 minutes',
  'confirmed'
);
```

---

## 📊 Success Metrics

After testing, you should have:
- ✅ Tab navigation works smoothly
- ✅ Bookings list displays correctly
- ✅ "Join Video Call" button respects 15-min window
- ✅ Video calls launch successfully
- ✅ Booking status updates automatically
- ✅ Token refresh prevents disconnections
- ✅ Past meetings don't show join button
- ✅ Error messages are clear and helpful

---

## 🚀 Next Steps (Phase 1)

Once testing is complete, implement:

1. **Email Notifications**
   - Booking confirmation with join link
   - 24-hour reminder
   - 15-minute reminder

2. **Admin Quick Launch**
   - Instant meeting creation (no booking form)
   - Generate shareable join links

3. **Real-time Updates**
   - WebSocket/Supabase Realtime for status changes
   - Participant count in meeting

4. **Meeting History**
   - Separate page showing all past meetings
   - Export to CSV

---

## 📝 Testing Notes Template

Use this to track your testing:

```
Date: _____________
Tester: _____________

Test 1 - View Bookings: [ ] Pass [ ] Fail
Notes: 

Test 2 - Create Booking: [ ] Pass [ ] Fail
Notes:

Test 3 - Join Video Call: [ ] Pass [ ] Fail
Notes:

Test 4 - Join Window: [ ] Pass [ ] Fail
Notes:

Test 5 - Admin Access: [ ] Pass [ ] Fail
Notes:

Test 6 - Token Refresh: [ ] Pass [ ] Fail
Notes:

Test 7 - Leave Updates Status: [ ] Pass [ ] Fail
Notes:

Test 8 - Multiple Participants: [ ] Pass [ ] Fail
Notes:

Test 9 - Past Meetings: [ ] Pass [ ] Fail
Notes:

Test 10 - Error Handling: [ ] Pass [ ] Fail
Notes:

Overall Status: [ ] All Pass [ ] Needs Work
```

---

## 🎉 You're Ready!

The VideoCall + Meetings system is fully integrated and ready for testing. Start with Test 1 and work through the checklist systematically.

**Good luck with testing!** 🚀
