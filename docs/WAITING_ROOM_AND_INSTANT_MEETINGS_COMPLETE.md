# Waiting Room & Instant Meeting Invitations - Complete Implementation

## Overview
This document describes the complete implementation of:
1. **Waiting Room & Host Approval** - Customers wait for host approval before joining
2. **Instant Meeting Invitations** - Admins can send instant meeting invites via email
3. **Enhanced Admin Controls** - View waiting participants, approve/reject access

## 🚨 CRITICAL: Database Migration Required

**The waiting room feature will NOT work until you apply the database migration!**

### Apply Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `/migrations/add_waiting_status_to_bookings.sql`
5. Paste into the editor
6. Click **Run** to execute

### Apply Migration via Supabase CLI

```bash
# Make sure you have Supabase CLI installed and linked
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Verify Migration Success

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if waiting status exists
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'booking_status';

-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('waiting_since', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'rejection_reason');
```

Expected results:
- Should see 'waiting' in the status enum list
- Should see all 6 new columns listed

---

## Feature 1: Waiting Room & Host Approval

### How It Works

1. **Customer Joins Early**
   - Customer clicks meeting link before scheduled time
   - System automatically routes them to waiting room
   - Booking status changes to 'waiting'
   - Customer sees animated waiting screen with timer

2. **Host Notification**
   - Admin/Host opens MeetingsAdminModal
   - WaitingRoomControls panel shows at top of bookings list
   - Displays all participants waiting with their info:
     - Customer name and email
     - Meeting title
     - How long they've been waiting

3. **Host Actions**
   - **Admit Button**: Approves participant, changes status to 'in_progress', customer proceeds to video call
   - **Deny Button**: Rejects participant with optional reason, changes status to 'cancelled'

### Files Created/Modified

**New API Endpoints:**
- `/api/meetings/waiting-room/enter` - POST: Enter waiting room, GET: List waiting participants
- `/api/meetings/waiting-room/approve` - POST: Host approves participant
- `/api/meetings/waiting-room/reject` - POST: Host rejects participant

**New Components:**
- `/src/components/modals/MeetingsModals/WaitingRoom/WaitingRoom.tsx` - Customer waiting screen
- `/src/components/modals/MeetingsModals/WaitingRoom/WaitingRoomControls.tsx` - Host control panel

**Modified Files:**
- `/src/types/meetings.ts` - Added 'waiting' status and waiting room fields
- `/src/context/MeetingContext.tsx` - Updated Booking interface
- `/src/components/modals/MeetingsModals/ManagedVideoCall.tsx` - Integrated WaitingRoom
- `/src/hooks/useMeetingLauncher.ts` - Added waiting room entry logic
- `/src/components/modals/MeetingsModals/MeetingsAdminModal/AdminBookingsList.tsx` - Integrated WaitingRoomControls

### Testing the Waiting Room

1. **Apply the database migration first!** (See instructions above)

2. **Create a test booking:**
   ```bash
   # Use Supabase SQL Editor or your admin interface
   # Create a booking scheduled 5 minutes from now
   ```

3. **Test as customer:**
   - Navigate to `/meetings/join/{booking_id}` BEFORE the scheduled time
   - Should see waiting room screen
   - Timer should show how long you've been waiting

4. **Test as host:**
   - Open admin panel → Meetings
   - Should see waiting room controls at top
   - Should see the waiting participant
   - Click "Admit" - customer should proceed to video call

5. **Test rejection:**
   - Have another customer join early
   - Click "Deny" and enter optional reason
   - Customer should see rejection message

### Status Flow

```
Customer joins early → 'waiting' → Host approves → 'in_progress' → Call ends → 'completed'
                                 ↓
                         Host denies → 'cancelled'
```

---

## Feature 2: Instant Meeting Invitations

### How It Works

1. **Admin Initiates**
   - Admin opens MeetingsAdminModal → Bookings List
   - Clicks "Send Instant Invite" button
   - Modal opens with form

2. **Form Fields**
   - Meeting Type (dropdown)
   - Meeting Title
   - Customer Name
   - Customer Email
   - Duration (pre-filled from meeting type)
   - Optional Notes

3. **System Actions**
   - Creates booking with `scheduled_at = NOW`
   - Status automatically set to 'confirmed'
   - Sends email invitation using AWS SES
   - Email contains:
     - Meeting details
     - Host name
     - "Join Now" button with meeting link
     - Optional notes from admin

4. **Customer Experience**
   - Receives email immediately
   - Clicks "Join Video Meeting" button
   - Joins video call directly (no waiting room since it's instant)

### Files Created

**New API Endpoint:**
- `/src/app/api/meetings/instant-invite/route.ts` - POST: Create instant meeting and send email

**New Component:**
- `/src/components/modals/MeetingsModals/InstantMeetingModal.tsx` - Instant invite form modal

**Modified Files:**
- `/src/app/api/send-email/route.ts` - Added `meeting_invitation` email template (plain text & HTML)
- `/src/components/modals/MeetingsModals/MeetingsAdminModal/AdminBookingsList.tsx` - Added instant meeting button

### Email Template

The system uses two email templates for meeting invitations:

**Plain Text:**
```
Hi {{name}},

You've been invited to a video meeting!

Meeting Details:
- Meeting: {{meeting_title}}
- Host: {{host_name}}
- Date & Time: {{meeting_time}}
- Duration: {{duration_minutes}} minutes
- Notes: {{meeting_notes}}

Join the meeting: {{emailDomainRedirection}}
```

**HTML:**
- Styled info box with meeting details
- Large blue "Join Video Meeting" button
- Meeting link at bottom
- Responsive design

### Testing Instant Meetings

1. **Open admin panel:**
   ```
   Navigate to Meetings → Admin View
   ```

2. **Click "Send Instant Invite" button:**
   - Should open modal with form

3. **Fill out form:**
   - Select meeting type
   - Enter test customer email (use your own)
   - Enter customer name
   - Add meeting title: "Quick Test Meeting"
   - Optional: Add notes

4. **Submit form:**
   - Should see success toast
   - Check email inbox
   - Should receive invitation email with meeting link

5. **Test email link:**
   - Click "Join Video Meeting" button in email
   - Should go directly to video call (no waiting room)

### API Request Example

```bash
curl -X POST https://your-domain.com/api/meetings/instant-invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "meeting_type_id": "uuid-of-meeting-type",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "title": "Quick Consultation",
    "duration_minutes": 30,
    "notes": "Looking forward to speaking with you!",
    "send_email": true
  }'
```

---

## Feature 3: Enhanced Admin Controls

### Current Implementation

**WaitingRoomControls Panel:**
- Shows all waiting participants across all meetings
- Real-time updates (polls every 5 seconds)
- Actions per participant:
  - View customer name, email, meeting title
  - See waiting duration
  - Admit to meeting
  - Deny access with reason

**AdminBookingsList Enhancements:**
- Added "Waiting" status filter
- Integrated waiting room controls at top
- Added "Send Instant Invite" button
- Shows booking count by status

### Future Enhancements (Not Yet Implemented)

These were mentioned in the original requirements but not yet built:

1. **View Active Participants**
   - Show who's currently in each meeting
   - Query `meeting_participants` table
   - Display participant list per booking

2. **End Meeting Button**
   - Allow admin to end meeting for all participants
   - New endpoint: `/api/meetings/end-meeting`
   - Disconnect all participants and set status to 'completed'

3. **Reschedule Bookings**
   - New modal to change scheduled_at time
   - New endpoint: `/api/meetings/reschedule`
   - Send notification to customer about time change

---

## Configuration

### Environment Variables Required

Make sure these are set in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL

# AWS SES (for emails)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EMAIL_FROM=noreply@yourdomain.com
```

### Supabase Row Level Security (RLS)

Make sure your `bookings` table has appropriate RLS policies:

```sql
-- Allow admins to read all bookings in their organization
CREATE POLICY "Admins can view organization bookings"
ON bookings FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE organization_id = bookings.organization_id 
    AND role = 'admin'
  )
);

-- Allow admins to update bookings in their organization
CREATE POLICY "Admins can update organization bookings"
ON bookings FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE organization_id = bookings.organization_id 
    AND role = 'admin'
  )
);
```

---

## Troubleshooting

### Waiting Room Not Appearing

**Problem:** Customer joins early but goes straight to video call

**Solutions:**
1. **Check database migration:**
   ```sql
   SELECT * FROM bookings WHERE id = 'booking-id';
   -- Should have waiting_since, approved_by, etc columns
   ```

2. **Check useMeetingLauncher logic:**
   - Open browser console
   - Look for "Should enter waiting room" log
   - Verify `isAdmin`, `isHost`, and time calculations

3. **Check booking status:**
   ```sql
   -- Status should change to 'waiting' when customer joins early
   SELECT id, status, waiting_since FROM bookings WHERE id = 'booking-id';
   ```

### Email Not Sending

**Problem:** Instant meeting created but no email received

**Solutions:**
1. **Check AWS SES configuration:**
   - Verify email address is verified in AWS SES
   - Check SES sending limits (sandbox vs production)

2. **Check API logs:**
   ```bash
   # Check browser network tab
   # Look for /api/send-email request
   # Check response for errors
   ```

3. **Test email endpoint directly:**
   ```bash
   curl -X POST https://your-domain.com/api/send-email \
     -H "Content-Type: application/json" \
     -d '{
       "type": "meeting_invitation",
       "to": "test@example.com",
       "organization_id": "your-org-id",
       "name": "Test User",
       "emailDomainRedirection": "https://example.com",
       "placeholders": {
         "meeting_title": "Test Meeting",
         "host_name": "Admin",
         "meeting_time": "Now",
         "duration_minutes": "30",
         "meeting_notes": "",
         "meeting_notes_html": ""
       }
     }'
   ```

### Controls Not Visible

**Problem:** Admin doesn't see waiting room controls or instant meeting button

**Solutions:**
1. **Check user role:**
   ```sql
   SELECT role FROM profiles WHERE id = 'user-id';
   -- Should be 'admin'
   ```

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

3. **Check component rendering:**
   - Open React DevTools
   - Search for `WaitingRoomControls` component
   - Verify it's mounted with correct props

### Database Migration Errors

**Problem:** Migration fails with "relation already exists" or "type already exists"

**Solutions:**
1. **Check if migration was already applied:**
   ```sql
   -- Check for waiting status
   SELECT unnest(enum_range(NULL::booking_status));
   ```

2. **If partially applied, rollback and reapply:**
   ```sql
   -- Remove new columns if they exist
   ALTER TABLE bookings DROP COLUMN IF EXISTS waiting_since;
   -- ... drop other columns ...
   
   -- Then run full migration again
   ```

3. **Manual cleanup if needed:**
   ```sql
   -- Drop and recreate status enum (CAREFUL - this affects existing data)
   ALTER TABLE bookings ALTER COLUMN status TYPE text;
   DROP TYPE IF EXISTS booking_status;
   CREATE TYPE booking_status AS ENUM (...);
   ALTER TABLE bookings ALTER COLUMN status TYPE booking_status USING status::booking_status;
   ```

---

## Performance Considerations

### Polling Intervals

The system uses polling to check for status updates:

- **WaitingRoom (customer):** Polls every 3 seconds
- **WaitingRoomControls (host):** Polls every 5 seconds

**Optimization Ideas:**
- Implement WebSocket for real-time updates
- Use Supabase Realtime subscriptions
- Add exponential backoff for polling

### Database Indexes

Consider adding indexes for common queries:

```sql
-- Index for waiting room queries
CREATE INDEX idx_bookings_status_waiting 
ON bookings(status) 
WHERE status = 'waiting';

-- Index for organization bookings
CREATE INDEX idx_bookings_org_scheduled 
ON bookings(organization_id, scheduled_at);

-- Index for host bookings
CREATE INDEX idx_bookings_host 
ON bookings(host_user_id, scheduled_at);
```

---

## Security Considerations

### Access Control

1. **Waiting Room Approval:**
   - Only booking host or admin can approve/reject
   - Verified via `host_user_id` or profile role check

2. **Instant Meetings:**
   - Only admins can send instant invites
   - Enforced at API level with role check

3. **Email Security:**
   - Meeting links should use secure tokens
   - Consider adding expiration to links
   - Validate booking ownership before joining

### Rate Limiting

Consider implementing rate limits for:
- Instant meeting creation (prevent spam)
- Waiting room approval requests
- Email sending (prevent abuse)

---

## Next Steps

### Recommended Enhancements

1. **WebSocket Integration**
   - Replace polling with real-time updates
   - Use Supabase Realtime or Socket.io

2. **Meeting Recordings**
   - Save recording metadata to database
   - Link recordings to bookings

3. **Meeting Analytics**
   - Track join times, duration, participants
   - Generate reports for admins

4. **Calendar Integration**
   - Sync meetings to Google Calendar, Outlook
   - Send calendar invites with emails

5. **SMS Notifications**
   - Send SMS reminders before meetings
   - SMS alerts when admitted from waiting room

### Testing Checklist

- [ ] Database migration applied successfully
- [ ] Customer can enter waiting room
- [ ] Host can see waiting participants
- [ ] Host can approve participants
- [ ] Host can reject participants
- [ ] Instant meeting modal opens
- [ ] Instant meeting creates booking
- [ ] Invitation email is sent
- [ ] Email link works correctly
- [ ] Video call starts successfully
- [ ] Status updates correctly throughout flow

---

## Support

If you encounter issues:

1. Check this documentation first
2. Review browser console for errors
3. Check Supabase logs for database errors
4. Review API endpoint responses
5. Test individual components in isolation

For additional help, refer to:
- `/docs/MEETINGS_PHASE2_IMPLEMENTATION.md` - Original implementation guide
- Supabase Documentation: https://supabase.com/docs
- Twilio Video Documentation: https://www.twilio.com/docs/video
