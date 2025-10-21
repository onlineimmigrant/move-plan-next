# Meetings Modal Architecture

## Directory Structure

```
src/
├── components/
│   ├── modals/
│   │   ├── _shared/
│   │   │   └── BaseModal.tsx          # Shared modal infrastructure
│   │   └── MeetingsModals/
│   │       ├── shared/
│   │       │   ├── components/         # ← MOVED HERE
│   │       │   │   ├── Calendar.tsx    # Shared calendar component
│   │       │   │   ├── BookingForm.tsx # Shared booking form
│   │       │   │   └── index.ts        # Exports
│   │       │   └── types.ts            # Shared TypeScript types
│   │       ├── MeetingsAdminModal/     # ← NEW
│   │       │   ├── MeetingsAdminModal.tsx
│   │       │   ├── MeetingsAdminToggleButton.tsx
│   │       │   └── index.ts
│   │       └── MeetingsBookingModal/
│   │           ├── MeetingsBookingModal.tsx
│   │           ├── MeetingsAccountToggleButton.tsx  # ← UPDATED (pathname check)
│   │           └── index.ts
│   └── Meetings/
│       ├── Calendar/                   # ← REMOVED (moved to MeetingsModals/shared)
│       ├── VideoCall/
│       └── Meetings.tsx
└── app/
    └── [locale]/
        └── admin/
            └── page.tsx                # ← UPDATED (added admin toggle button)
```

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Experience                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│     Customer Pages       │         │      Admin Pages         │
│  (/, /services, etc.)    │         │      (/admin/*)          │
└──────────────────────────┘         └──────────────────────────┘
           │                                      │
           │                                      │
           ▼                                      ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│ MeetingsAccountToggle    │         │ MeetingsAdminToggle      │
│       Button             │         │       Button             │
│                          │         │                          │
│  if (!pathname.starts    │         │  if (isAdmin) {          │
│    With('/admin'))       │         │    render button         │
│    render button         │         │  }                       │
└──────────────────────────┘         └──────────────────────────┘
           │                                      │
           │ onClick                              │ onClick
           ▼                                      ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│  MeetingsBookingModal    │         │  MeetingsAdminModal      │
│                          │         │                          │
│  - Customer focused      │         │  - Admin controls        │
│  - Limited options       │         │  - Full access           │
│  - Auto email from auth  │         │  - Custom email input    │
│  - Available slots only  │         │  - Any slot selection    │
└──────────────────────────┘         └──────────────────────────┘
           │                                      │
           │                                      │
           └──────────────┬───────────────────────┘
                          │
                          │ Both use
                          ▼
              ┌───────────────────────┐
              │   Shared Components   │
              │                       │
              │  - BaseModal          │
              │  - Calendar           │
              │  - BookingForm        │
              └───────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component Hierarchy                           │
└─────────────────────────────────────────────────────────────────┘

ClientProviders.tsx
  │
  ├─ BannerAwareContent
  │   │
  │   ├─ <main>{children}</main>
  │   │
  │   └─ <MeetingsAccountToggleButton />  ──┐
  │                                          │
  │                                          │ if pathname !== '/admin/*'
  │                                          │
  │                                          ▼
  │                              ┌────────────────────────┐
  │                              │ MeetingsBookingModal   │
  │                              │                        │
  │                              │  Uses:                 │
  │                              │  - Calendar (shared)   │
  │                              │  - BookingForm (shared)│
  │                              │  - BaseModal           │
  │                              └────────────────────────┘
  │
  └─ ... other providers


/admin/page.tsx
  │
  ├─ Admin Dashboard UI
  │
  └─ <MeetingsAdminToggleButton />  ──┐
                                       │
                                       │ if isAdmin
                                       │
                                       ▼
                           ┌────────────────────────┐
                           │ MeetingsAdminModal     │
                           │                        │
                           │  Uses:                 │
                           │  - Calendar (shared)   │
                           │  - BookingForm (shared)│
                           │  - BaseModal           │
                           └────────────────────────┘
```

## Pathname-Based Rendering

```
┌─────────────────────────────────────────────────────────────────┐
│             Route-Based Toggle Button Visibility                │
└─────────────────────────────────────────────────────────────────┘

Route: /
├─ MeetingsAccountToggleButton: ✅ VISIBLE
└─ MeetingsAdminToggleButton:   ❌ HIDDEN (admin pages only)

Route: /services
├─ MeetingsAccountToggleButton: ✅ VISIBLE
└─ MeetingsAdminToggleButton:   ❌ HIDDEN (admin pages only)

Route: /admin
├─ MeetingsAccountToggleButton: ❌ HIDDEN (pathname check)
└─ MeetingsAdminToggleButton:   ✅ VISIBLE (isAdmin check)

Route: /admin/products/management
├─ MeetingsAccountToggleButton: ❌ HIDDEN (pathname check)
└─ MeetingsAdminToggleButton:   ✅ VISIBLE (isAdmin check)
```

## Permission Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                      Access Control                              │
└─────────────────────────────────────────────────────────────────┘

                    │  Customer Pages  │  Admin Pages    │
                    │  (non /admin)    │  (/admin/*)     │
────────────────────┼──────────────────┼─────────────────┤
Regular User        │                  │                 │
(authenticated)     │  ✅ Account Btn  │  ❌ No Btn      │
────────────────────┼──────────────────┼─────────────────┤
Admin User          │                  │                 │
(admin role)        │  ✅ Account Btn  │  ✅ Admin Btn   │
────────────────────┼──────────────────┼─────────────────┤
Owner User          │                  │                 │
(owner role)        │  ✅ Account Btn  │  ✅ Admin Btn   │
────────────────────┼──────────────────┼─────────────────┤
Unauthenticated     │                  │                 │
(no session)        │  ❌ No Btn       │  ❌ No Btn      │
────────────────────┴──────────────────┴─────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    Modal State Flow                              │
└─────────────────────────────────────────────────────────────────┘

Toggle Button Component
  │
  ├─ const [isOpen, setIsOpen] = useState(false)
  │
  ├─ onClick={() => setIsOpen(true)}
  │   │
  │   └─ Opens modal ─────────────────────┐
  │                                        │
  └─ <Modal isOpen={isOpen}               │
           onClose={() => setIsOpen(false)}>
                                           │
                                           ▼
                                 ┌──────────────────┐
                                 │  Modal Component │
                                 │                  │
                                 │  Internal State: │
                                 │  - currentView   │
                                 │  - selectedSlot  │
                                 │  - formData      │
                                 │  - loading       │
                                 │  - error         │
                                 └──────────────────┘
                                           │
                                           │ onClose()
                                           ▼
                                   setIsOpen(false)
                                   Modal closes
```

## Shared Component Reuse

```
┌─────────────────────────────────────────────────────────────────┐
│              Component Sharing Architecture                      │
└─────────────────────────────────────────────────────────────────┘

BaseModal (_shared/)
    │
    ├─ Used by: MeetingsAdminModal
    └─ Used by: MeetingsBookingModal

Calendar (shared/components/)
    │
    ├─ Used by: MeetingsAdminModal
    │   └─ Props: events, currentDate, view, onSlotClick
    │
    └─ Used by: MeetingsBookingModal
        └─ Props: events, currentDate, view, onSlotClick

BookingForm (shared/components/)
    │
    ├─ Used by: MeetingsAdminModal
    │   └─ Props: formData, meetingTypes, onChange, onSubmit
    │
    └─ Used by: MeetingsBookingModal
        └─ Props: formData, meetingTypes, onChange, onSubmit

Types (shared/types.ts)
    │
    ├─ Used by: MeetingsAdminModal
    ├─ Used by: MeetingsBookingModal
    ├─ Used by: Calendar
    └─ Used by: BookingForm
```

## Import Graph

```
MeetingsAdminModal.tsx
  │
  ├─ import { BaseModal } from '@/components/modals/_shared/BaseModal'
  ├─ import { Calendar, BookingForm } from '../shared/components'
  ├─ import { CalendarEvent, CalendarView } from '@/types/meetings'
  ├─ import { useSettings } from '@/context/SettingsContext'
  └─ import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

MeetingsBookingModal.tsx
  │
  ├─ import { BaseModal } from '@/components/modals/_shared/BaseModal'
  ├─ import { Calendar, BookingForm } from '../shared/components'
  ├─ import { CalendarEvent, CalendarView, ... } from '../shared/types'
  ├─ import { useSettings } from '@/context/SettingsContext'
  └─ import { format } from 'date-fns'

MeetingsAccountToggleButton.tsx
  │
  ├─ import { useState } from 'react'
  ├─ import { usePathname } from 'next/navigation'  ← NEW
  ├─ import { VideoCameraIcon } from '@heroicons/react/24/outline'
  └─ import MeetingsBookingModal from './MeetingsBookingModal'

MeetingsAdminToggleButton.tsx
  │
  ├─ import { useState } from 'react'
  ├─ import { CalendarDaysIcon } from '@heroicons/react/24/outline'
  ├─ import { useAuth } from '@/context/AuthContext'
  └─ import MeetingsAdminModal from './MeetingsAdminModal'
```

---

**Legend:**
- ✅ = Visible/Enabled
- ❌ = Hidden/Disabled
- ← = Direction of change/addition
- → = Data/control flow
