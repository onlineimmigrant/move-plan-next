# How to Use MeetingsSettingsModal

## Quick Start

The `MeetingsSettingsModal` can be triggered in **3 ways**:

### ✅ Option 1: Inside Admin Modal (Recommended - Already Implemented!)

When you open the **MeetingsAdminModal**, there's now a **"Settings"** button in the header (top-right corner).

**Usage:**
1. Click any "Admin: Manage Meetings" button in your app
2. Look for the **Settings** button with ⚙️ icon in the top-right
3. Click it to open the Meeting Settings modal
4. Configure 24-hour scheduling, business hours, slot durations, etc.
5. Save and your changes will apply immediately

**Code:**
The settings button is automatically shown in the Admin Modal header.

---

### ✅ Option 2: Standalone Toggle Button

Add a dedicated button anywhere in your admin interface.

**Import:**
```tsx
import { MeetingsSettingsToggleButton } from '@/components/modals/MeetingsModals/MeetingsSettingsModal';
```

**Usage:**
```tsx
// Default button
<MeetingsSettingsToggleButton />

// Custom text
<MeetingsSettingsToggleButton buttonText="Configure Meetings" />

// Different variants
<MeetingsSettingsToggleButton variant="primary" />  // Teal gradient
<MeetingsSettingsToggleButton variant="secondary" /> // Gray
<MeetingsSettingsToggleButton variant="ghost" />    // Transparent

// Different sizes
<MeetingsSettingsToggleButton size="sm" />
<MeetingsSettingsToggleButton size="md" />
<MeetingsSettingsToggleButton size="lg" />

// Without icon
<MeetingsSettingsToggleButton showIcon={false} />
```

**Add to Admin Page:**
```tsx
// In /src/app/[locale]/admin/page.tsx
import { MeetingsSettingsToggleButton } from '@/components/modals/MeetingsModals/MeetingsSettingsModal';

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Your other admin content */}
      
      <div className="flex gap-4">
        <MeetingsAdminToggleButton />
        <MeetingsSettingsToggleButton />  {/* Add this */}
      </div>
    </div>
  );
}
```

---

### ✅ Option 3: Direct Component (Advanced)

For full control, use the modal component directly.

**Import:**
```tsx
import MeetingsSettingsModal from '@/components/modals/MeetingsModals/MeetingsSettingsModal';
```

**Usage:**
```tsx
function YourComponent() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button onClick={() => setShowSettings(true)}>
        Open Settings
      </button>

      <MeetingsSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
```

---

## Settings Modal Features

When opened, you can configure:

### 🕐 24-Hour Admin Scheduling
- **Toggle ON**: Admins can schedule meetings 24/7 (up to 48 slots)
- **Toggle OFF**: Admins see business hours only
- **Configure time range**: Set custom start/end times (e.g., 6 AM - 10 PM)

### 🏢 Customer Booking Hours
- Set standard business hours for customer bookings
- Default: 9:00 AM - 5:00 PM
- Customers always see these hours regardless of admin settings

### ⏱️ Time Slot Duration
Choose from:
- **15 minutes** (96 slots for 24 hours)
- **30 minutes** (48 slots for 24 hours) - Default
- **45 minutes** (32 slots for 24 hours)
- **60 minutes** (24 slots for 24 hours)

### 📅 Available Days
Select which days of the week are available:
- Mon, Tue, Wed, Thu, Fri (default)
- Customize any combination

### 📋 Booking Rules
- **Min Notice**: Minimum hours in advance (default: 2 hours)
- **Max Days Ahead**: How far in future to allow bookings (default: 90 days)

### ✅ Auto-Confirmation
- **ON**: Bookings automatically confirmed
- **OFF**: Require manual approval

---

## Example: Enable 24-Hour Scheduling

1. **Open Settings:**
   - In Admin Modal, click "Settings" button in header, OR
   - Click `<MeetingsSettingsToggleButton />` if added to your page

2. **Toggle 24-Hour Mode:**
   - Find "24-Hour Admin Scheduling" section
   - Click the toggle to enable (it turns teal/cyan)

3. **Set Time Range (Optional):**
   - Admin Start Time: `00:00` (midnight)
   - Admin End Time: `23:59` (11:59 PM)
   - Or choose custom range like `06:00` to `22:00`

4. **Adjust Slot Duration:**
   - Click "30 min" (or your preferred duration)

5. **Save:**
   - Click "Save Settings" button at bottom
   - Green success message will appear

6. **Verify:**
   - Close settings modal
   - In Admin Modal, select a date
   - You should now see 48 time slots (for 30-min duration)!

---

## Visual Guide

### Admin Modal with Settings Button
```
┌─────────────────────────────────────┐
│ 📅 Admin: Schedule Meeting          │  ← Title
│                        [⚙️ Settings] │  ← Click here!
├─────────────────────────────────────┤
│                                     │
│        Calendar View                │
│                                     │
└─────────────────────────────────────┘
```

### Settings Modal Layout
```
┌──────────────────────────────────────┐
│ ⚙️ Meeting Settings              [×] │
├──────────────────────────────────────┤
│                                      │
│ 🕐 24-Hour Admin Scheduling     [⚪] │ ← Toggle
│   Admin Start Time: [00:00]          │
│   Admin End Time:   [23:59]          │
│                                      │
│ 🏢 Customer Booking Hours            │
│   Start: [09:00]  End: [17:00]       │
│                                      │
│ ⏱️ Time Slot Duration                │
│  [15min] [30min] [45min] [60min]     │
│                                      │
│ 📅 Available Days                    │
│  [Sun][Mon][Tue][Wed][Thu][Fri][Sat]│
│                                      │
│           [Cancel] [Save Settings]   │
└──────────────────────────────────────┘
```

---

## File Locations

### Components
- **Modal**: `src/components/modals/MeetingsModals/MeetingsSettingsModal/MeetingsSettingsModal.tsx`
- **Toggle Button**: `src/components/modals/MeetingsModals/MeetingsSettingsModal/MeetingsSettingsToggleButton.tsx`
- **Admin Modal** (with settings button): `src/components/modals/MeetingsModals/MeetingsAdminModal/MeetingsAdminModal.tsx`

### API Endpoints
- `GET /api/meetings/settings?organization_id=xxx` - Fetch settings
- `PUT /api/meetings/settings` - Update settings

### Database
- Table: `organization_meeting_settings`
- Migration: `database/migrations/007_add_admin_time_slot_config.sql`

---

## Permission Requirements

⚠️ **Admin Only**: Both the toggle button and settings modal are **automatically hidden** for non-admin users.

The components check:
```tsx
const { session, isAdmin } = useAuth();

if (!session || !isAdmin) {
  return null; // Component doesn't render
}
```

---

## Troubleshooting

### Settings button not visible in Admin Modal
✅ It's in the **calendar view** (top-right header)
❌ It's hidden when in booking view (shows "Back to Calendar" instead)

### Settings not saving
- Check browser console for errors
- Verify `organization_id` exists in settings context
- Ensure database migration was applied

### Changes not reflecting in time slots
- Close and reopen the Admin Modal
- Select a different date to trigger slot reload
- Check that `admin_24hour_scheduling` is `true` in database

---

## Next Steps

1. ✅ **Test it**: Open Admin Modal → Click Settings → Enable 24-hour mode
2. ✅ **Verify**: Select a date and count the time slots (should be 48 for 30-min)
3. ✅ **Customize**: Add standalone button to your admin dashboard if needed
4. ✅ **Configure**: Set up your organization's specific hours and rules

---

**Quick Reference:**
- Settings button is in **Admin Modal header** (already there!)
- Standalone button: `<MeetingsSettingsToggleButton />`
- Direct modal: `<MeetingsSettingsModal isOpen={...} onClose={...} />`

Enjoy your 24-hour scheduling feature! 🎉
