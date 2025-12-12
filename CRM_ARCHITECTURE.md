# CRM System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CRM Integration                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          ProfileDetailView (Main Container)           │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Customer Header (Name, Email, Phone)          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Tabs: Appointments | Support | Cases | Activity│  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  Tab Content (Conditional Rendering):                  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  AppointmentsSection                            │  │  │
│  │  │  - Stats: Total, Upcoming, Completed, Cancelled │  │  │
│  │  │  - Appointment List                             │  │  │
│  │  │  - Book New Button → MeetingsBookingModal       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  SupportSection                                 │  │  │
│  │  │  - Stats: Total, Open, In Progress, Resolved    │  │  │
│  │  │  - Ticket List                                  │  │  │
│  │  │  - Create Ticket Form (toggleable)              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  CasesSection                                   │  │  │
│  │  │  - Stats: Total, Active, Pending, Closed        │  │  │
│  │  │  - Expandable Case Cards                        │  │  │
│  │  │  - Case Details (appointments, tickets, billing)│  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  ActivityTimeline                               │  │  │
│  │  │  - Filter: All | Appointments | Tickets | Cases │  │  │
│  │  │  - Chronological Activity Feed                  │  │  │
│  │  │  - Smart Timestamps, Icons, Status Badges       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
User Interaction
      │
      ▼
┌──────────────┐
│  Component   │ ◄───── Props (profileId, onClose)
└──────────────┘
      │
      ▼
┌──────────────┐
│ API Request  │ ◄───── GET /api/crm/profiles/[id]/[resource]
└──────────────┘
      │
      ▼
┌──────────────┐
│ API Route    │ ◄───── Validate, Query Supabase
└──────────────┘
      │
      ▼
┌──────────────┐
│  Supabase    │ ◄───── Execute Query + RLS
└──────────────┘
      │
      ▼
┌──────────────┐
│  Response    │ ◄───── JSON data
└──────────────┘
      │
      ▼
┌──────────────┐
│  Component   │ ◄───── setState(data)
│   Updates    │        Re-render
└──────────────┘
```

---

## 📊 Database Relationships

```
organizations (existing)
      │
      ├─────────► profiles (existing)
      │                │
      │                ├─────────► bookings (modified)
      │                │                │
      │                │                ├──► meeting_types
      │                │                └──► cases (NEW)
      │                │                         │
      │                └─────────► tickets (modified)
      │                                 │
      │                                 └──► cases (NEW)
      │
      └─────────► cases (NEW)
                       │
                       └──► profiles (customer_id)
```

**Linking Structure:**
- `bookings.customer_id` → `profiles.id`
- `bookings.case_id` → `cases.id` (NEW)
- `tickets.customer_id` → `profiles.id`
- `tickets.case_id` → `cases.id` (NEW)
- `cases.customer_id` → `profiles.id`
- `cases.organization_id` → `organizations.id`

---

## 🎨 Component Hierarchy

```
ProfileDetailView
│
├── CustomerHeader
│   ├── Name
│   ├── Email
│   ├── Phone
│   └── CloseButton
│
├── TabNavigation
│   ├── AppointmentsTab
│   ├── SupportTab
│   ├── CasesTab
│   └── ActivityTab
│
└── TabContent (conditional)
    │
    ├── AppointmentsSection
    │   ├── StatsCards (4)
    │   ├── AppointmentList
    │   │   └── AppointmentCard[]
    │   └── BookNewButton
    │       └── MeetingsBookingModal
    │
    ├── SupportSection
    │   ├── StatsCards (4)
    │   ├── TicketList
    │   │   └── TicketCard[]
    │   └── CreateTicketForm
    │       ├── TitleInput
    │       ├── DescriptionTextarea
    │       ├── PrioritySelect
    │       └── SubmitButton
    │
    ├── CasesSection
    │   ├── StatsCards (4)
    │   └── CaseList
    │       └── CaseCard[] (expandable)
    │           ├── Header (number, status, priority)
    │           ├── Title
    │           └── Details (expanded)
    │               ├── Description
    │               ├── Dates (created, deadline)
    │               ├── Metrics (appointments, tickets, billed)
    │               └── BillingStatus
    │
    └── ActivityTimeline
        ├── FilterButtons
        │   ├── AllButton
        │   ├── AppointmentsButton
        │   ├── TicketsButton
        │   └── CasesButton
        └── ActivityFeed
            └── ActivityCard[]
                ├── Icon
                ├── Title
                ├── Description
                ├── Timestamp
                └── Status
```

---

## 🌊 User Flows

### Flow 1: View Customer Profile

```
1. User clicks customer in list
2. ProfileDetailView opens
3. Default to "Appointments" tab
4. Fetch appointments data
5. Display stats + list
6. User can switch tabs
7. Each tab loads its data independently
```

### Flow 2: Book Appointment from CRM

```
1. User in ProfileDetailView (Appointments tab)
2. Clicks "Book Appointment" button
3. MeetingsBookingModal opens
4. Modal receives prefilledData:
   - customerId: profile.id
   - caseId: null (or selected case)
5. User selects date/time/type
6. Submits booking
7. API saves booking with customer_id and case_id
8. Modal closes
9. AppointmentsSection refreshes
10. New appointment appears in list
```

### Flow 3: Create Support Ticket

```
1. User in ProfileDetailView (Support tab)
2. Clicks "New Ticket" button
3. Form appears
4. User fills:
   - Title (required)
   - Description (optional)
   - Priority (dropdown)
5. Clicks "Create Ticket"
6. API validates and saves
7. Form closes
8. SupportSection refreshes
9. New ticket appears in list
```

### Flow 4: View Case Details

```
1. User in ProfileDetailView (Cases tab)
2. Sees list of case cards
3. Clicks on a case card
4. Card expands to show:
   - Full description
   - Created date & deadline
   - Appointment count
   - Ticket count
   - Total billed amount
   - Billing status
5. Click again to collapse
```

### Flow 5: View Activity Timeline

```
1. User switches to "Activity" tab
2. System fetches all activities in parallel:
   - Appointments from bookings
   - Tickets
   - Case events
3. Combines and sorts chronologically
4. Displays in feed with:
   - Smart timestamps
   - Type icons
   - Status badges
5. User can filter by type:
   - All (default)
   - Appointments only
   - Tickets only
   - Cases only
```

---

## 🔌 API Endpoint Details

### GET /api/crm/profiles/[profileId]/appointments

**Purpose:** Fetch all bookings for a customer

**Query:**
```sql
SELECT 
  bookings.*,
  meeting_types.name,
  meeting_types.color
FROM bookings
LEFT JOIN meeting_types ON bookings.meeting_type_id = meeting_types.id
WHERE bookings.customer_id = [profileId]
ORDER BY booking_date DESC
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "booking_date": "2025-12-15",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "status": "confirmed",
      "case_id": "uuid",
      "notes": "Initial consultation",
      "meeting_type": {
        "name": "Legal Consultation",
        "color": "#667eea"
      }
    }
  ]
}
```

---

### GET /api/crm/profiles/[profileId]/tickets

**Purpose:** Fetch all support tickets for a customer

**Query:**
```sql
SELECT * 
FROM tickets
WHERE customer_id = [profileId]
ORDER BY created_at DESC
```

**Response:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "title": "Need document copies",
      "description": "Request copies of filed documents",
      "status": "open",
      "priority": "medium",
      "created_at": "2025-12-10T14:30:00Z",
      "case_id": "uuid"
    }
  ]
}
```

---

### POST /api/crm/profiles/[profileId]/tickets

**Purpose:** Create a new support ticket

**Request Body:**
```json
{
  "title": "Need help with paperwork",
  "description": "I need assistance filling out form X",
  "priority": "high",
  "customer_id": "uuid"
}
```

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "title": "Need help with paperwork",
    "status": "open",
    "priority": "high",
    "created_at": "2025-12-12T10:00:00Z"
  }
}
```

---

### GET /api/crm/profiles/[profileId]/cases

**Purpose:** Fetch all cases with appointment/ticket counts

**Query:**
```sql
SELECT 
  cases.*,
  COUNT(DISTINCT bookings.id) as booking_count,
  COUNT(DISTINCT tickets.id) as ticket_count
FROM cases
LEFT JOIN bookings ON bookings.case_id = cases.id
LEFT JOIN tickets ON tickets.case_id = cases.id
WHERE cases.customer_id = [profileId]
GROUP BY cases.id
ORDER BY cases.created_at DESC
```

**Response:**
```json
{
  "cases": [
    {
      "id": "uuid",
      "case_number": "CASE-2025-001",
      "title": "Immigration Petition",
      "status": "active",
      "case_type": "immigration",
      "priority": "high",
      "created_at": "2025-01-15T09:00:00Z",
      "deadline": "2026-01-15",
      "total_billed": 5000.00,
      "booking_count": 5,
      "ticket_count": 3
    }
  ]
}
```

---

## 🎯 State Management

### Component State

```typescript
// ProfileDetailView
const [activeTab, setActiveTab] = useState<TabType>('appointments');

// AppointmentsSection
const [bookings, setBookings] = useState<Booking[]>([]);
const [loading, setLoading] = useState(true);
const [showBookingModal, setShowBookingModal] = useState(false);

// SupportSection
const [tickets, setTickets] = useState<Ticket[]>([]);
const [loading, setLoading] = useState(true);
const [showNewTicketForm, setShowNewTicketForm] = useState(false);
const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });

// CasesSection
const [cases, setCases] = useState<Case[]>([]);
const [loading, setLoading] = useState(true);
const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

// ActivityTimeline
const [activities, setActivities] = useState<Activity[]>([]);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState<'all' | 'bookings' | 'tickets' | 'cases'>('all');
```

---

## 🎨 Styling System

### Color Palette

```typescript
// Primary Gradient
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// Status Colors
confirmed: '#10b981' (green)
completed: '#6366f1' (indigo)
cancelled: '#ef4444' (red)
pending: '#f59e0b' (amber)

open: '#f59e0b' (amber)
in_progress: '#3b82f6' (blue)
resolved: '#10b981' (green)

active: '#10b981' (green)
closed: '#6b7280' (gray)
on_hold: '#ef4444' (red)

// Priority Colors
urgent: '#ef4444' (red)
high: '#f59e0b' (amber)
medium: '#3b82f6' (blue)
low: '#10b981' (green)
```

### Component Styling

All components use:
- **Inline styles** (memoized with `useMemo` and `useCallback`)
- **Gradient backgrounds** for primary actions
- **Hover effects** for interactive elements
- **Responsive padding** and spacing
- **Border radius** for modern look (8px, 12px)
- **Box shadows** on hover for depth

---

## 📱 Responsive Design

```
Desktop (≥1024px):
- 4 stats cards in a row
- Full tab labels
- Expanded card layouts

Tablet (768px - 1023px):
- 2 stats cards per row
- Tab labels abbreviated
- Compact card layouts

Mobile (<768px):
- 1 stat card per row (stacked)
- Icon-only tabs
- Minimal padding
- Full-width buttons
```

---

## 🔒 Security

### RLS Policies Required

```sql
-- Cases table policies
CREATE POLICY "Users can view cases in their organization"
ON cases FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create cases in their organization"
ON cases FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update cases in their organization"
ON cases FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));
```

---

## ✅ Checklist for Go-Live

- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] TypeScript server restarted
- [ ] Components import successfully
- [ ] API routes respond correctly
- [ ] Bookings save with case_id
- [ ] Tickets save with case_id
- [ ] Activity timeline shows all data
- [ ] Stats calculate correctly
- [ ] Modal integration works
- [ ] No console errors
- [ ] Tested with real data
- [ ] Performance acceptable

---

**Architecture Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** Production Ready ✅
