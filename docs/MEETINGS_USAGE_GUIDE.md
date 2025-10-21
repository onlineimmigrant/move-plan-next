# Meetings Modal Usage Guide

## Quick Start

### For Customers (Regular Users)

#### 1. Accessing the Booking Modal

The booking button appears automatically on all non-admin pages:

```tsx
// Already included in ClientProviders.tsx - no setup needed!
// Button appears at bottom-right of screen
```

**Customer sees:**
- Floating blue button with video camera icon
- Click to open booking modal
- Simple booking flow with limited options

#### 2. Booking a Meeting

1. Click the floating video camera button
2. Select a time slot from the calendar
3. Fill in booking details (email auto-populated)
4. Submit booking
5. Receive confirmation

---

### For Administrators

#### 1. Accessing the Admin Modal

On admin pages (`/admin/*`), administrators see a dedicated admin button:

```tsx
// Example: Already added to /admin/page.tsx
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';

<MeetingsAdminToggleButton />
```

**Admin sees:**
- Admin-specific toggle button
- Full control over meeting scheduling
- Advanced options not available to customers

#### 2. Adding to Other Admin Pages

To add the admin button to other pages:

```tsx
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';

export default function YourAdminPage() {
  return (
    <div>
      <h1>Your Admin Content</h1>
      
      {/* Add admin meetings button */}
      <MeetingsAdminToggleButton 
        buttonText="Manage Meetings"
        variant="primary"
        size="md"
      />
    </div>
  );
}
```

#### 3. Customization Options

```tsx
<MeetingsAdminToggleButton
  buttonText="Schedule Admin Meeting"  // Custom text
  variant="secondary"                   // 'primary' | 'secondary' | 'ghost'
  size="lg"                             // 'sm' | 'md' | 'lg'
  showIcon={true}                       // Show/hide calendar icon
  className="my-custom-class"           // Additional CSS classes
/>
```

---

## Component APIs

### MeetingsAccountToggleButton

**Purpose:** Customer-facing meeting booking button

**Props:** None (internally managed)

**Usage:**
```tsx
import { MeetingsAccountToggleButton } from '@/components/modals/MeetingsModals';

<MeetingsAccountToggleButton />
```

**Features:**
- Auto-hides on `/admin` routes
- Floating position (fixed bottom-right)
- Opens MeetingsBookingModal
- No configuration needed

---

### MeetingsAdminToggleButton

**Purpose:** Admin meeting management button

**Props:**
```typescript
interface MeetingsAdminToggleButtonProps {
  buttonText?: string;      // Default: "Admin: Manage Meetings"
  className?: string;        // Additional CSS classes
  variant?: 'primary' | 'secondary' | 'ghost';  // Default: 'primary'
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  showIcon?: boolean;        // Default: true
}
```

**Usage:**
```tsx
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';

// Simple
<MeetingsAdminToggleButton />

// Customized
<MeetingsAdminToggleButton
  buttonText="Admin Meetings"
  variant="secondary"
  size="lg"
  className="ml-4"
/>
```

**Permission Handling:**
- Automatically checks user role
- Only renders for `admin` or `owner` roles
- Returns `null` for non-admin users

---

### MeetingsBookingModal

**Purpose:** Customer booking interface

**Props:**
```typescript
interface MeetingsBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSlot?: TimeSlot;
}
```

**Usage:**
```tsx
import { MeetingsBookingModal } from '@/components/modals/MeetingsModals';

const [isOpen, setIsOpen] = useState(false);

<MeetingsBookingModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  preselectedSlot={selectedSlot}  // Optional
/>
```

---

### MeetingsAdminModal

**Purpose:** Admin meeting management interface

**Props:**
```typescript
interface MeetingsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  onBookingSuccess?: (meetingId: string) => void;
}
```

**Usage:**
```tsx
import MeetingsAdminModal from '@/components/modals/MeetingsModals/MeetingsAdminModal';

const [isOpen, setIsOpen] = useState(false);

<MeetingsAdminModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialDate={new Date()}
  onBookingSuccess={(id) => console.log('Meeting created:', id)}
/>
```

---

## Common Use Cases

### 1. Default Setup (Already Configured)

Customer button is already included in `ClientProviders.tsx`:

```tsx
// src/app/ClientProviders.tsx
function BannerAwareContent({ ... }) {
  return (
    <>
      {/* Your content */}
      <MeetingsAccountToggleButton />  {/* Already here! */}
    </>
  );
}
```

### 2. Adding Admin Button to Dashboard

```tsx
// src/app/[locale]/admin/page.tsx
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <MeetingsAdminToggleButton />
    </div>
  );
}
```

### 3. Programmatic Modal Control

If you need to open modals programmatically:

```tsx
import { useState } from 'react';
import { MeetingsBookingModal } from '@/components/modals/MeetingsModals';

export default function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScheduleMeeting = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <button onClick={handleScheduleMeeting}>
        Schedule a Meeting
      </button>

      <MeetingsBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

### 4. Admin Modal with Callback

```tsx
import { useState } from 'react';
import MeetingsAdminModal from '@/components/modals/MeetingsModals/MeetingsAdminModal';

export default function AdminPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleBookingSuccess = (meetingId: string) => {
    console.log('New meeting created:', meetingId);
    // Refresh data, show notification, etc.
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create Meeting
      </button>

      <MeetingsAdminModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />
    </>
  );
}
```

---

## Troubleshooting

### Customer Button Not Showing

**Check:**
1. User is authenticated
2. Not on an `/admin` route
3. `ClientProviders.tsx` includes `<MeetingsAccountToggleButton />`

**Solution:**
```tsx
// Verify in ClientProviders.tsx
<MeetingsAccountToggleButton />  // Should be present
```

### Admin Button Not Showing

**Check:**
1. User has `admin` or `owner` role
2. Component is imported correctly
3. On an admin page

**Debug:**
```tsx
import { useAuth } from '@/context/AuthContext';

const { user, organizationRole } = useAuth();
console.log('Role:', organizationRole);  // Should be 'admin' or 'owner'
```

### Import Errors

**Common issue:** Wrong import path

```tsx
// ❌ Wrong
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals';

// ✅ Correct
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';
```

### TypeScript Errors

**Issue:** Type mismatches

**Solution:** Ensure you're using types from the correct location:

```tsx
import { 
  CalendarEvent, 
  CalendarView, 
  BookingFormData 
} from '@/components/modals/MeetingsModals/shared/types';
```

---

## Best Practices

### 1. Don't Mix Admin and Customer Modals

```tsx
// ❌ Don't do this
<MeetingsAccountToggleButton />
<MeetingsAdminToggleButton />

// ✅ Let pathname logic handle it
// Customer pages: MeetingsAccountToggleButton (automatic)
// Admin pages: MeetingsAdminToggleButton (manual)
```

### 2. Use Callbacks for Post-Booking Actions

```tsx
<MeetingsAdminModal
  onBookingSuccess={(id) => {
    // Refresh calendar
    // Show success notification
    // Update analytics
  }}
/>
```

### 3. Respect Permission Checks

```tsx
// ❌ Don't manually check permissions
{user?.role === 'admin' && <MeetingsAdminToggleButton />}

// ✅ Component handles it internally
<MeetingsAdminToggleButton />  // Automatically checks permissions
```

### 4. Customize for Your Brand

```tsx
<MeetingsAdminToggleButton
  buttonText="Book Consultation"
  variant="primary"
  size="lg"
  className="my-brand-class"
/>
```

---

## Migration Guide

### From Old Calendar Component

If you were using the old `/components/Meetings/Calendar` components:

**Before:**
```tsx
import { Calendar, BookingForm } from '@/components/Meetings/Calendar';
```

**After:**
```tsx
import { Calendar, BookingForm } from '@/components/modals/MeetingsModals/shared/components';
```

### Adding to Existing Project

1. **Customer Setup:** Already done in `ClientProviders.tsx`
2. **Admin Setup:** Add to your admin pages:

```tsx
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';

// In your admin page/layout
<MeetingsAdminToggleButton />
```

---

## FAQ

**Q: Can customers access the admin modal?**  
A: No, the admin toggle button only renders for users with `admin` or `owner` roles.

**Q: Can admins see both buttons?**  
A: No, on admin pages (`/admin/*`) only the admin button shows. On customer pages, admins see the customer button.

**Q: How do I customize the modal appearance?**  
A: The modals use `BaseModal` which supports theming. Pass custom `className` to toggle buttons or modify the modal components.

**Q: Can I use both modals on the same page?**  
A: Not recommended. Use pathname-based logic to show the appropriate modal for each context.

**Q: How do I handle meeting notifications?**  
A: Use the `onBookingSuccess` callback to trigger notifications:

```tsx
<MeetingsAdminModal
  onBookingSuccess={(id) => {
    toast.success('Meeting scheduled!');
    sendNotification(id);
  }}
/>
```

**Q: Where are the types defined?**  
A: `/src/components/modals/MeetingsModals/shared/types.ts` and `/src/types/meetings.ts`

**Q: Can I integrate with external calendar systems?**  
A: Yes, implement webhook handlers in the `onBookingSuccess` callback to sync with Google Calendar, Outlook, etc.

---

## Support

For issues or questions:
1. Check this guide
2. Review `/docs/MEETINGS_MODALS_REFACTOR.md` for technical details
3. Review `/docs/MEETINGS_ARCHITECTURE.md` for architecture diagrams
4. Check component JSDoc comments
