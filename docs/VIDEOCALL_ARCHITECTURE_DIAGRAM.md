# VideoCall Integration - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser Window                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Root Layout (layout.tsx)                    │ │
│  │                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────┐│ │
│  │  │              ClientProviders.tsx                          ││ │
│  │  │                                                            ││ │
│  │  │  ┌──────────────────────────────────────────────────────┐││ │
│  │  │  │         QueryClientProvider                         │││ │
│  │  │  │  ┌────────────────────────────────────────────────┐ │││ │
│  │  │  │  │         AuthProvider                          │ │││ │
│  │  │  │  │  ┌──────────────────────────────────────────┐ │ │││ │
│  │  │  │  │  │       BannerProvider                    │ │ │││ │
│  │  │  │  │  │  ┌────────────────────────────────────┐ │ │ │││ │
│  │  │  │  │  │  │     BasketProvider                │ │ │ │││ │
│  │  │  │  │  │  │  ┌──────────────────────────────┐ │ │ │ │││ │
│  │  │  │  │  │  │  │   SettingsProvider          │ │ │ │ │││ │
│  │  │  │  │  │  │  │  ┌────────────────────────┐ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │ 🆕 MeetingProvider    │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │                        │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  [Global Video State] │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  - activeMeeting      │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  - isVideoCallOpen    │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  - startVideoCall()   │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  - endVideoCall()     │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  - refreshToken()     │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │                        │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  ┌──────────────────┐ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ ToastProvider   │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │  [Other Providers]│ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │                  │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │  ┌────────────┐ │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │  │ App Content│ │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │  └────────────┘ │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  └──────────────────┘ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │                        │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  🆕 ManagedVideoCall  │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  ┌──────────────────┐ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ z-index: 2000   │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ (Above all)     │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │                  │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ VideoCallModal  │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ - Twilio Video  │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ - Auto Refresh  │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  │ - Status Update │ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  │  └──────────────────┘ │ │ │ │ │ │││ │
│  │  │  │  │  │  │  │  └────────────────────────┘ │ │ │ │ │││ │
│  │  │  │  │  │  │  └──────────────────────────────┘ │ │ │ │││ │
│  │  │  │  │  │  └────────────────────────────────────┘ │ │ │││ │
│  │  │  │  │  └──────────────────────────────────────────┘ │ │││ │
│  │  │  │  └────────────────────────────────────────────────┘ │││ │
│  │  │  └──────────────────────────────────────────────────────┘││ │
│  │  └───────────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │          🆕 MeetingsBookingModal (z-index: 1000)              │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────┬──────────────────────────┐  │ │
│  │  │      My Meetings (Tab)      │  Book New Meeting (Tab) │  │ │
│  │  └─────────────────────────────┴──────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐│ │
│  │  │ 🆕 MyBookingsList (when "My Meetings" tab active)        ││ │
│  │  │                                                           ││ │
│  │  │  ┌─────────────────────────────────────────────────────┐││ │
│  │  │  │ Booking Card #1                                     │││ │
│  │  │  │ - Meeting Type: "Consultation"                      │││ │
│  │  │  │ - Date/Time: "Oct 22, 2025 at 2:00 PM"             │││ │
│  │  │  │ - Status: 🟢 Confirmed                              │││ │
│  │  │  │ - Countdown: "Starts in 5 minutes"                  │││ │
│  │  │  │                                                     │││ │
│  │  │  │ ┌─────────────────────────────────────────────────┐│││ │
│  │  │  │ │  🆕 Join Video Call (Button - Enabled)          ││││ │
│  │  │  │ │                                                  ││││ │
│  │  │  │ │  onClick → useMeetingLauncher()                 ││││ │
│  │  │  │ │          → API: /api/meetings/launch-video      ││││ │
│  │  │  │ │          → startVideoCall()                     ││││ │
│  │  │  │ │          → ManagedVideoCall opens               ││││ │
│  │  │  │ └─────────────────────────────────────────────────┘│││ │
│  │  │  └─────────────────────────────────────────────────────┘││ │
│  │  │                                                           ││ │
│  │  │  ┌─────────────────────────────────────────────────────┐││ │
│  │  │  │ Booking Card #2                                     │││ │
│  │  │  │ - Meeting Type: "Follow-up"                         │││ │
│  │  │  │ - Date/Time: "Oct 23, 2025 at 10:00 AM"            │││ │
│  │  │  │ - Status: 🟢 Confirmed                              │││ │
│  │  │  │                                                     │││ │
│  │  │  │ [Join Video Call] (Disabled - Too early)            │││ │
│  │  │  │ Available 15 minutes before start                   │││ │
│  │  │  └─────────────────────────────────────────────────────┘││ │
│  │  └──────────────────────────────────────────────────────────┘│ │
│  │                                                                │ │
│  │  OR                                                            │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐│ │
│  │  │ Calendar View (when "Book New" tab active)               ││ │
│  │  │ - Existing booking flow                                  ││ │
│  │  │ - Calendar → BookingForm → Submit                        ││ │
│  │  └──────────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER CLICKS "JOIN VIDEO CALL"              │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  MyBookingsList Component                                          │
│  - Calls: useMeetingLauncher().launchFromBooking({ bookingId })   │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  useMeetingLauncher Hook                                           │
│  1. Validate booking exists                                        │
│  2. Check time window (15 min)                                     │
│  3. Call API: POST /api/meetings/launch-video                      │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  API Route: /api/meetings/launch-video                             │
│  1. Validate user authentication                                   │
│  2. Check user is participant or admin                             │
│  3. Validate 15-minute join window (admins exempt)                 │
│  4. Generate Twilio AccessToken (1-hour TTL)                       │
│  5. Update booking status: confirmed → in_progress                 │
│  6. Return: { token, roomName, participantName, bookingId }        │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  useMeetingLauncher Hook (continued)                               │
│  4. Receive token response                                         │
│  5. Call: startVideoCall({ token, roomName, ... })                 │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  MeetingContext (startVideoCall function)                          │
│  1. Set activeMeeting state                                        │
│  2. Set isVideoCallOpen = true                                     │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  ManagedVideoCall Component                                        │
│  - Detects isVideoCallOpen = true                                  │
│  - Renders VideoCallModal with token                               │
│  - Starts 50-minute token refresh timer                            │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  VideoCallModal Component                                          │
│  - Connects to Twilio Video room                                   │
│  - Shows video/audio streams                                       │
│  - User can interact, share screen, etc.                           │
└────────────────────┬───────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐
│ USER STAYS > 50 MIN │  │ USER CLICKS "LEAVE" │
└─────────┬───────────┘  └─────────┬───────────┘
          │                        │
          ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐
│ Token Refresh Timer │  │ onLeave() Handler   │
│ - Calls:            │  │ - Calls:            │
│   refreshToken()    │  │   endVideoCall()    │
│ - API:              │  │ - Updates status:   │
│   /api/meetings/    │  │   in_progress →     │
│   refresh-token     │  │   completed         │
│ - Gets new token    │  │ - Closes modal      │
└─────────────────────┘  └─────────────────────┘
```

---

## File Dependencies

```
ClientProviders.tsx
  ├─ Imports: MeetingProvider (from MeetingContext.tsx)
  ├─ Imports: ManagedVideoCall (from ManagedVideoCall.tsx)
  └─ Renders: <MeetingProvider> wrapping app
              <ManagedVideoCall /> at root level

MeetingContext.tsx
  ├─ Exports: MeetingProvider, useMeeting
  ├─ State: activeMeeting, isVideoCallOpen
  └─ Functions: startVideoCall(), endVideoCall(), refreshToken()

ManagedVideoCall.tsx
  ├─ Uses: useMeeting() hook
  ├─ Imports: VideoCallModal (existing component)
  ├─ API Calls: /api/meetings/refresh-token (auto at 50 min)
  └─ Renders: <VideoCallModal /> when isVideoCallOpen = true

useMeetingLauncher.ts
  ├─ Uses: useMeeting() hook
  ├─ API Calls: /api/meetings/launch-video
  └─ Functions: launchFromBooking(), canJoinMeeting(), getTimeUntilMeeting()

MyBookingsList.tsx
  ├─ Uses: useMeetingLauncher() hook
  ├─ API Calls: /api/meetings/bookings (fetch bookings)
  └─ Renders: Booking cards with "Join Video Call" buttons

MeetingsBookingModal.tsx
  ├─ Imports: MyBookingsList
  ├─ State: activeTab ('my-meetings' | 'book-new')
  └─ Renders: Tab navigation + MyBookingsList OR Calendar

/api/meetings/launch-video/route.ts
  ├─ Imports: Twilio SDK (AccessToken, VideoGrant)
  ├─ Validates: User, booking, time window
  ├─ Generates: Twilio token (1-hour TTL)
  └─ Updates: booking.status → 'in_progress'

/api/meetings/refresh-token/route.ts
  ├─ Imports: Twilio SDK (AccessToken, VideoGrant)
  ├─ Validates: User, booking
  └─ Returns: New token (1-hour TTL)
```

---

## Security Flow

```
User Request
     ↓
┌────────────────────────┐
│ Check Authentication   │ ← Supabase Auth
│ (Supabase Session)     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Validate Booking       │ ← Database Query
│ - Booking exists?      │
│ - User is participant? │
│ - Admin role?          │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Check Join Window      │
│ - Is within 15 min?    │
│ - OR is admin?         │
│ - Meeting not past?    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Generate Twilio Token  │ ← Twilio SDK
│ - 1-hour TTL           │
│ - Room name = booking  │
│ - Grants: video, audio │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Return Credentials     │ → Client
│ {token, roomName, ...} │
└────────────────────────┘
```

---

## Component Rendering Order

```
1. App Loads
2. ClientProviders renders
3. MeetingProvider wraps children
4. ManagedVideoCall mounts (hidden, z-2000)
5. App content renders normally

When user opens MeetingsBookingModal:
6. Modal opens (z-1000)
7. "My Meetings" tab active by default
8. MyBookingsList fetches and displays bookings

When user clicks "Join Video Call":
9. useMeetingLauncher() called
10. API generates token
11. startVideoCall() updates MeetingContext state
12. ManagedVideoCall detects state change
13. VideoCallModal renders (z-2000, above booking modal)
14. User joins Twilio room

When user leaves:
15. onLeave() called
16. endVideoCall() updates state
17. API updates booking status
18. VideoCallModal unmounts
19. User still sees MeetingsBookingModal underneath
```

---

## Z-Index Stacking

```
z-index: 2000  ← ManagedVideoCall (VideoCallModal)
                 Always on top
                 
z-index: 1000  ← MeetingsBookingModal
                 Below video call
                 
z-index: 999   ← Other modals
                 
z-index: 50    ← Fixed headers/navbars
                 
z-index: 10    ← Dropdowns/tooltips
                 
z-index: 1     ← Regular content
```

---

## State Management

```
MeetingContext State:
{
  activeMeeting: {
    roomName: "meeting_uuid",
    token: "eyJxxx...",
    participantName: "John Doe",
    bookingId: "uuid"
  } | null,
  
  isVideoCallOpen: boolean
}

Functions:
- startVideoCall(data) → Sets activeMeeting, opens modal
- endVideoCall() → Clears activeMeeting, closes modal
- refreshToken(bookingId) → Updates token in activeMeeting
```

---

## API Request/Response Examples

### Launch Video Call

**Request**:
```http
POST /api/meetings/launch-video
Content-Type: application/json
Authorization: Bearer <supabase-session-token>

{
  "booking_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Success)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "meeting_550e8400-e29b-41d4-a716-446655440000",
  "participantName": "John Doe",
  "bookingId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Error - Too Early)**:
```json
{
  "error": "Meeting can only be joined 15 minutes before start time"
}
```

### Refresh Token

**Request**:
```http
POST /api/meetings/refresh-token
Content-Type: application/json
Authorization: Bearer <supabase-session-token>

{
  "booking_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Database Schema (Relevant Tables)

```sql
-- bookings table (used by video call system)
bookings (
  id UUID PRIMARY KEY,
  organization_id UUID,
  meeting_type_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT, -- 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  metadata JSONB
)

-- Status lifecycle:
-- confirmed → in_progress (when user joins)
-- in_progress → completed (when user leaves)
```

---

This diagram shows the complete integration architecture, data flow, and component relationships. All pieces are connected and working together! 🎉
