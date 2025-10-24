# System Architecture - Waiting Room & Instant Meetings

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MeetingsAdminModal                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    AdminBookingsList                          │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │          WaitingRoomControls (Top Panel)              │   │  │
│  │  │  • Shows all waiting participants                     │   │  │
│  │  │  • Admit/Deny buttons                                 │   │  │
│  │  │  • Real-time polling (5s interval)                    │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │  [Status Filter ▼] [+ Send Instant Invite]  👥 12     │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │  Booking List                                          │   │  │
│  │  │  • Shows all bookings                                  │   │  │
│  │  │  • Filter by status                                    │   │  │
│  │  │  • Join/Cancel actions                                 │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       InstantMeetingModal                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Meeting Type: [Dropdown          ▼]                         │  │
│  │  Title:        [Quick Consultation_________________]         │  │
│  │  Customer:     [John Doe___________________________]         │  │
│  │  Email:        [john@example.com___________________]         │  │
│  │  Duration:     [30] minutes                                  │  │
│  │  Notes:        [___________________________________]         │  │
│  │                [___________________________________]         │  │
│  │                                                               │  │
│  │  [Cancel]  [📧 Send Invite]                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ManagedVideoCall Component                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  if (status === 'waiting')                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              WaitingRoom Component                      │  │  │
│  │  │  🔵 Waiting for host to let you in...                  │  │  │
│  │  │                                                         │  │  │
│  │  │  Meeting: Quick Consultation                           │  │  │
│  │  │  Host: Sarah Admin                                     │  │  │
│  │  │  Scheduled: 2:00 PM                                    │  │  │
│  │  │  Waiting time: 00:45                                   │  │  │
│  │  │                                                         │  │  │
│  │  │  (Polls every 3s for status update)                    │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  else                                                         │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              VideoCallModal                             │  │  │
│  │  │  [Video call interface with Twilio]                    │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Waiting Room Flow

```
┌──────────┐         ┌────────────────┐         ┌──────────┐
│ Customer │         │ useMeeting     │         │   API    │
│  Browser │         │ Launcher Hook  │         │ Routes   │
└────┬─────┘         └────────┬───────┘         └────┬─────┘
     │                        │                      │
     │ 1. Click meeting link  │                      │
     │───────────────────────>│                      │
     │                        │                      │
     │                        │ 2. Check: isEarly?   │
     │                        │    !isAdmin?         │
     │                        │    !isHost?          │
     │                        │                      │
     │                        │ 3. POST /waiting-    │
     │                        │    room/enter        │
     │                        │─────────────────────>│
     │                        │                      │
     │                        │ 4. Status: waiting   │
     │                        │<─────────────────────│
     │                        │                      │
     │ 5. Render WaitingRoom  │                      │
     │<───────────────────────│                      │
     │                        │                      │
     │ ╔════════════════════╗ │                      │
     │ ║  Waiting Screen    ║ │                      │
     │ ║  (polls every 3s)  ║ │                      │
     │ ╚════════════════════╝ │                      │
     │                        │                      │
     │ 6. Poll: GET booking/id│                      │
     │────────────────────────┼─────────────────────>│
     │                        │                      │
     │ 7. status: still waiting                      │
     │<──────────────────────────────────────────────│
     │                        │                      │
     │ ... (continues polling until status changes)  │
     │                        │                      │

┌──────────┐         ┌────────────────┐         ┌──────────┐
│   Host   │         │ WaitingRoom    │         │   API    │
│  Browser │         │ Controls       │         │ Routes   │
└────┬─────┘         └────────┬───────┘         └────┬─────┘
     │                        │                      │
     │ 1. Open admin panel    │                      │
     │───────────────────────>│                      │
     │                        │                      │
     │                        │ 2. GET /waiting-room │
     │                        │    /enter?hostId=... │
     │                        │─────────────────────>│
     │                        │                      │
     │                        │ 3. List of waiting   │
     │                        │    participants      │
     │                        │<─────────────────────│
     │                        │                      │
     │ 4. Show participant    │                      │
     │    cards with buttons  │                      │
     │<───────────────────────│                      │
     │                        │                      │
     │ ╔════════════════════╗ │                      │
     │ ║ John Doe           ║ │                      │
     │ ║ john@example.com   ║ │                      │
     │ ║ Waiting: 00:45     ║ │                      │
     │ ║ [Admit]  [Deny]    ║ │                      │
     │ ╚════════════════════╝ │                      │
     │                        │                      │
     │ 5. Click "Admit"       │                      │
     │───────────────────────>│                      │
     │                        │                      │
     │                        │ 6. POST /waiting-room│
     │                        │    /approve          │
     │                        │─────────────────────>│
     │                        │                      │
     │                        │ 7. Update booking    │
     │                        │    status: in_progress│
     │                        │<─────────────────────│
     │                        │                      │
     │ 8. Toast: "Admitted!"  │                      │
     │<───────────────────────│                      │
     │                        │                      │
     
Customer's waiting room component detects status change → Transitions to VideoCallModal
```

### Instant Meeting Flow

```
┌──────────┐         ┌────────────────┐         ┌──────────┐         ┌──────────┐
│   Admin  │         │ InstantMeeting │         │   API    │         │ Customer │
│  Browser │         │     Modal      │         │ Routes   │         │  Email   │
└────┬─────┘         └────────┬───────┘         └────┬─────┘         └────┬─────┘
     │                        │                      │                      │
     │ 1. Click "+ Send       │                      │                      │
     │    Instant Invite"     │                      │                      │
     │───────────────────────>│                      │                      │
     │                        │                      │                      │
     │ 2. Show modal form     │                      │                      │
     │<───────────────────────│                      │                      │
     │                        │                      │                      │
     │ 3. Fill form & submit  │                      │                      │
     │───────────────────────>│                      │                      │
     │                        │                      │                      │
     │                        │ 4. POST /instant-    │                      │
     │                        │    invite            │                      │
     │                        │─────────────────────>│                      │
     │                        │                      │                      │
     │                        │                      │ 5. Create booking    │
     │                        │                      │    scheduled_at=NOW  │
     │                        │                      │    status=confirmed  │
     │                        │                      │                      │
     │                        │                      │ 6. POST /send-email  │
     │                        │                      │    type=meeting_     │
     │                        │                      │    invitation        │
     │                        │                      │                      │
     │                        │                      │ 7. AWS SES sends     │
     │                        │                      │────────────────────> │
     │                        │                      │                      │
     │                        │ 8. Success response  │                      │
     │                        │<─────────────────────│                      │
     │                        │                      │                      │
     │ 9. Toast: "Invite sent"│                      │                      │
     │<───────────────────────│                      │                      │
     │                        │                      │                      │
     │ 10. Close modal        │                      │                      │
     │<───────────────────────│                      │                      │
     │                        │                      │                      │
     │                        │                      │    ╔═════════════╗   │
     │                        │                      │    ║ Email with  ║   │
     │                        │                      │    ║ Join button ║   │
     │                        │                      │    ╚══════┬══════╝   │
     │                        │                      │           │          │
     │                        │                      │    11. Click "Join   │
     │                        │                      │        Video Meeting"│
     │                        │                      │<─────────────────────│
     │                        │                      │                      │
     │                        │    Video call launches instantly            │
```

---

## 🗄️ Database Schema Changes

```sql
-- Before Migration
CREATE TYPE booking_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  meeting_type_id UUID NOT NULL,
  host_user_id UUID,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  status booking_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- After Migration (NEW FIELDS)
ALTER TYPE booking_status ADD VALUE 'waiting';  -- ⭐ NEW

ALTER TABLE bookings ADD COLUMN waiting_since TIMESTAMPTZ;        -- ⭐ NEW
ALTER TABLE bookings ADD COLUMN approved_by UUID                  -- ⭐ NEW
  REFERENCES profiles(id);
ALTER TABLE bookings ADD COLUMN approved_at TIMESTAMPTZ;          -- ⭐ NEW
ALTER TABLE bookings ADD COLUMN rejected_by UUID                  -- ⭐ NEW
  REFERENCES profiles(id);
ALTER TABLE bookings ADD COLUMN rejected_at TIMESTAMPTZ;          -- ⭐ NEW
ALTER TABLE bookings ADD COLUMN rejection_reason TEXT;            -- ⭐ NEW

CREATE INDEX idx_bookings_status ON bookings(status);             -- ⭐ NEW
```

---

## 📡 API Endpoints Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Waiting Room APIs                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  POST /api/meetings/waiting-room/enter                             │
│  ├─ Body: { bookingId }                                            │
│  ├─ Action: Set status to 'waiting', record waiting_since          │
│  └─ Response: { booking, waiting: true }                           │
│                                                                     │
│  GET /api/meetings/waiting-room/enter                              │
│  ├─ Query: ?hostUserId={id}&organizationId={id}                    │
│  ├─ Action: List all waiting participants for host                 │
│  └─ Response: { bookings: [...] }                                  │
│                                                                     │
│  POST /api/meetings/waiting-room/approve                           │
│  ├─ Body: { bookingId }                                            │
│  ├─ Auth: Must be host or admin                                    │
│  ├─ Action: Set status to 'in_progress', record approval           │
│  └─ Response: { booking, approved: true }                          │
│                                                                     │
│  POST /api/meetings/waiting-room/reject                            │
│  ├─ Body: { bookingId, reason? }                                   │
│  ├─ Auth: Must be host or admin                                    │
│  ├─ Action: Set status to 'cancelled', record rejection            │
│  └─ Response: { booking, rejected: true }                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Instant Meeting API                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  POST /api/meetings/instant-invite                                 │
│  ├─ Body: {                                                        │
│  │    meeting_type_id: string,                                     │
│  │    customer_email: string,                                      │
│  │    customer_name: string,                                       │
│  │    title: string,                                               │
│  │    duration_minutes?: number,                                   │
│  │    notes?: string,                                              │
│  │    send_email?: boolean                                         │
│  │  }                                                               │
│  ├─ Auth: Must be admin                                            │
│  ├─ Action: Create booking with NOW timestamp, send email          │
│  └─ Response: { booking, success: true }                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          Email API                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  POST /api/send-email                                              │
│  ├─ Body: {                                                        │
│  │    type: 'meeting_invitation',                                  │
│  │    to: string,                                                  │
│  │    organization_id: string,                                     │
│  │    name: string,                                                │
│  │    emailDomainRedirection: string,                              │
│  │    placeholders: {                                              │
│  │      meeting_title: string,                                     │
│  │      host_name: string,                                         │
│  │      meeting_time: string,                                      │
│  │      duration_minutes: string,                                  │
│  │      meeting_notes: string,                                     │
│  │      meeting_notes_html: string                                 │
│  │    }                                                             │
│  │  }                                                               │
│  ├─ Action: Send HTML + plain text email via AWS SES               │
│  └─ Response: { success: true }                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```
App
└── MeetingContext (provides meeting state)
    ├── MeetingsAdminModal
    │   └── AdminBookingsList
    │       ├── WaitingRoomControls
    │       │   ├── Fetches waiting participants
    │       │   ├── Maps to participant cards
    │       │   └── Approve/Deny buttons
    │       │
    │       ├── InstantMeetingModal (when open)
    │       │   ├── Form fields
    │       │   ├── Meeting type selector
    │       │   └── Submit → API call
    │       │
    │       └── Booking list items
    │           ├── Status badge
    │           ├── Join button
    │           └── Cancel button
    │
    └── ManagedVideoCall
        ├── if (status === 'waiting')
        │   └── WaitingRoom
        │       ├── Meeting info display
        │       ├── Waiting timer
        │       ├── Animated indicator
        │       └── Status polling
        │
        └── else
            └── VideoCallModal
                └── Twilio video interface
```

---

## 🔐 Security & Permissions

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Access Control Matrix                       │
├──────────────────┬──────────────┬──────────────┬───────────────────┤
│ Action           │ Customer     │ Host         │ Admin             │
├──────────────────┼──────────────┼──────────────┼───────────────────┤
│ Enter waiting    │ ✅ Own mtg   │ ✅ Own mtg   │ ✅ Any mtg        │
│ room             │              │              │                   │
├──────────────────┼──────────────┼──────────────┼───────────────────┤
│ View waiting     │ ❌ No        │ ✅ Own mtgs  │ ✅ All org mtgs   │
│ participants     │              │              │                   │
├──────────────────┼──────────────┼──────────────┼───────────────────┤
│ Approve          │ ❌ No        │ ✅ Own mtgs  │ ✅ All org mtgs   │
│ participant      │              │              │                   │
├──────────────────┼──────────────┼──────────────┼───────────────────┤
│ Reject           │ ❌ No        │ ✅ Own mtgs  │ ✅ All org mtgs   │
│ participant      │              │              │                   │
├──────────────────┼──────────────┼──────────────┼───────────────────┤
│ Send instant     │ ❌ No        │ ❌ No        │ ✅ Yes            │
│ invite           │              │              │                   │
├──────────────────┼──────────────┼──────────────┼───────────────────┤
│ View all         │ ❌ No        │ ✅ Own mtgs  │ ✅ All org mtgs   │
│ bookings         │              │              │                   │
└──────────────────┴──────────────┴──────────────┴───────────────────┘

Validation Points:
1. API Level: Check Authorization header + user profile
2. Component Level: Hide/show based on role
3. Database Level: RLS policies enforce org boundaries
```

---

## ⏱️ Timing & Polling

```
WaitingRoom Component (Customer)
├── Initial render
├── Poll every 3 seconds
│   └── GET /api/meetings/bookings/{id}
│       ├── if status changed to 'in_progress'
│       │   └── Call onStatusChange → Switch to video
│       ├── if status changed to 'cancelled'
│       │   └── Show rejection message
│       └── else continue polling
└── Show elapsed time counter (updates every 1s)

WaitingRoomControls Component (Host)
├── Initial render
├── Poll every 5 seconds
│   └── GET /api/meetings/waiting-room/enter?host...
│       └── Update participant list
├── On approve click
│   ├── POST /api/meetings/waiting-room/approve
│   ├── Show success toast
│   └── Remove from list
└── On deny click
    ├── POST /api/meetings/waiting-room/reject
    ├── Show success toast
    └── Remove from list
```

---

## 📧 Email Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .button { 
      background: #4F46E5; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 6px;
      text-decoration: none;
    }
    .info-box {
      background: #F3F4F6;
      border-left: 4px solid #4F46E5;
      padding: 16px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Hi {{name}},</h1>
  <p>You've been invited to a video meeting!</p>
  
  <div class="info-box">
    <div><strong>Meeting:</strong> {{meeting_title}}</div>
    <div><strong>Host:</strong> {{host_name}}</div>
    <div><strong>Date & Time:</strong> {{meeting_time}}</div>
    <div><strong>Duration:</strong> {{duration_minutes}} minutes</div>
    {{meeting_notes_html}}
  </div>
  
  <p style="text-align: center;">
    <a href="{{emailDomainRedirection}}" class="button">
      Join Video Meeting
    </a>
  </p>
</body>
</html>
```

---

**📌 Remember: Apply the database migration first before testing!**

See: `/APPLY_MIGRATION_FIRST.md`
