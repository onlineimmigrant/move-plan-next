# Admin 24-Hour Format & Business Hours Highlighting Implementation

## Overview
This document describes the implementation of server-side 24-hour format preference, business hours highlighting for admins, and timezone display enhancements.

## Features Implemented

### 1. Server-Side 24-Hour Format Preference
- **Database Field**: `organization_meeting_settings.is_24_hours` (boolean)
- **Default Value**: `true` (24-hour format)
- **Storage**: Persisted in database, not localStorage
- **Scope**: Organization-wide preference for admin users

### 2. Business Hours Highlighting
- Admin users see **all** time slots (00:00 - 23:59) when scheduling
- Time slots within customer business hours are visually highlighted with:
  - Cyan-teal gradient background
  - "Customer Hours" badge
  - Tooltip: "This time slot is within customer booking hours"
- Business hours info displayed in header (e.g., "Customer hours: 09:00 - 17:00 (highlighted)")

### 3. Timezone Display
- Shows user's GMT/UTC offset (e.g., "GMT+02:00")
- Calculated from browser timezone using `getTimezoneOffset()`
- Displayed in time slot selection header

### 4. UI/UX Improvements
- Removed header checkbox for 24h toggle
- 24-hour format now controlled via Settings Modal
- Settings modal toggle updates immediately on save
- Responsive display shows format and timezone info
- Tooltips provide context for Customer Hours badges

## Files Modified

### API Layer
1. **`/api/meetings/settings/route.ts`**
   - Added `is_24_hours` to default settings
   - Added validation for `is_24_hours` field in PUT handler
   - Default value: `true`

### Settings Modal
2. **`MeetingsSettingsModal.tsx`**
   - Updated `MeetingSettings` interface to include `is_24_hours`
   - Removed legacy `use_24hour_format` and `timezone` fields
   - Updated toggle UI to use `is_24_hours`
   - Updated toggle description: "applies to admin views"
   - Updated timezone display to show browser timezone

### Admin Modal
3. **`MeetingsAdminModal.tsx`**
   - Added `meetingSettings` state to store business hours and format preference
   - Loads `is_24_hours` from API on mount
   - Removed localStorage-based 24h toggle from header
   - Passes `is_24_hours` as `timeFormat24` prop to BookingForm
   - Passes `businessHours` object to BookingForm
   - Reloads settings after Settings Modal closes
   - Fixed `is_business_hours` mapping (handles both snake_case and camelCase)

### Booking Form
4. **`BookingForm.tsx`**
   - Added props:
     - `timeFormat24?: boolean` - preferred format prop
     - `businessHours?: { start: string; end: string }` - org business hours
   - Kept legacy `use24HourFormat` prop for backward compatibility
   - Added `getGmtOffset()` helper function
   - Updated time display to conditionally use 24h or 12h format
   - Enhanced header to show:
     - Format preference (24-hour/12-hour)
     - GMT offset (e.g., "GMT+02:00")
     - Business hours for admins (e.g., "Customer hours: 09:00 - 17:00 (highlighted)")
   - Added tooltip to "Customer Hours" badge
   - Responsive layout for header info

## Database Schema

### Field Added
```sql
-- Already exists in your database
ALTER TABLE organization_meeting_settings 
ADD COLUMN is_24_hours BOOLEAN DEFAULT true;
```

### Migration 008 (Pending)
The migration `008_simplify_admin_scheduling.sql` is ready to apply:
- Drops redundant fields: `admin_24hour_scheduling`, `admin_slot_start`, `admin_slot_end`
- Updates PostgreSQL function `get_available_time_slots()` to always give admins full 24-hour access
- Adds `is_business_hours` flag to returned slots

## User Flow

### Admin Scheduling Flow
1. Admin opens **Admin: Schedule Meeting** modal
2. Settings are loaded from API (including `is_24_hours` preference)
3. Admin clicks on a date to book
4. **Time slot selection shows**:
   - All 48 slots (00:00 - 23:30) for 30-minute duration
   - Format: 24-hour (e.g., "13:00") or 12-hour (e.g., "1:00 PM") based on preference
   - GMT offset: "Your time: GMT+02:00"
   - Business hours context: "Customer hours: 09:00 - 17:00 (highlighted)"
   - Highlighted slots with cyan background and "Customer Hours" badge
5. Admin can select **any** slot (including outside business hours)
6. Customer booking windows only show highlighted slots

### Changing Format Preference
1. Admin clicks **Settings** button in Admin modal header
2. Settings modal opens
3. Admin toggles **"Use 24-Hour Time Format"** switch
4. Admin clicks **Save**
5. Settings modal closes, admin modal reloads settings
6. Time slot display updates immediately to reflect new format

## Technical Details

### Time Format Logic
```typescript
// Effective format determination
const effective24 = timeFormat24 !== undefined 
  ? timeFormat24 
  : (use24HourFormat ?? true);

// Display time
effective24 
  ? format(slot.start, 'HH:mm')  // 13:00
  : format(slot.start, 'h:mm a')  // 1:00 PM
```

### GMT Offset Calculation
```typescript
const getGmtOffset = () => {
  const offsetMin = new Date().getTimezoneOffset();
  const totalMin = -offsetMin; // Invert: getTimezoneOffset returns minutes behind UTC
  const sign = totalMin >= 0 ? '+' : '-';
  const absMin = Math.abs(totalMin);
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mm = String(absMin % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};
```

### Business Hours Highlighting
```typescript
// In time slot button
const isBusinessHour = slot.isBusinessHours;

// Apply conditional styling
className={
  isSelected
    ? 'bg-gradient-to-br from-teal-500 to-cyan-600'
    : isBusinessHour
      ? 'bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200'
      : 'bg-white'
}
```

## API Response Structure

### `/api/meetings/settings` Response
```json
{
  "organization_id": "uuid",
  "slot_duration_minutes": 30,
  "business_hours_start": "09:00:00",
  "business_hours_end": "17:00:00",
  "available_days": [1, 2, 3, 4, 5],
  "is_24_hours": true,
  "auto_confirm_bookings": false,
  ...
}
```

### `/api/meetings/available-slots` Response
```json
{
  "slots": [
    {
      "start": "2025-10-20T00:00:00Z",
      "end": "2025-10-20T00:30:00Z",
      "available": true,
      "is_business_hours": false
    },
    {
      "start": "2025-10-20T09:00:00Z",
      "end": "2025-10-20T09:30:00Z",
      "available": true,
      "is_business_hours": true
    },
    ...
  ],
  "settings": {
    "is_admin_mode": true,
    "business_hours_start": "09:00:00",
    "business_hours_end": "17:00:00"
  }
}
```

## Testing Checklist

- [ ] Apply migration 008 to database
- [ ] Verify `is_24_hours` field exists in `organization_meeting_settings` table
- [ ] Open Admin modal, verify settings load correctly
- [ ] Toggle 24-hour format in Settings Modal
- [ ] Save settings, verify modal updates immediately
- [ ] Verify time slots display in correct format (24h/12h)
- [ ] Verify GMT offset shows correctly based on browser timezone
- [ ] Verify business hours info displays in header
- [ ] Verify business hours slots are highlighted (cyan background)
- [ ] Verify "Customer Hours" badge appears on highlighted slots
- [ ] Hover over badge, verify tooltip appears
- [ ] Select slot outside business hours, verify booking works
- [ ] Test on mobile (responsive header layout)
- [ ] Test timezone changes (change OS timezone and refresh)

## Migration Instructions

### 1. Apply Database Migration
```bash
# Connect to your Supabase/PostgreSQL database
psql -d your_database -f database/migrations/008_simplify_admin_scheduling.sql

# Or via Supabase Dashboard:
# - Go to SQL Editor
# - Paste contents of 008_simplify_admin_scheduling.sql
# - Run
```

### 2. Verify Migration
```sql
-- Check table structure
\d organization_meeting_settings

-- Should NOT have: admin_24hour_scheduling, admin_slot_start, admin_slot_end
-- Should have: is_24_hours

-- Test function
SELECT * FROM get_available_time_slots(
  'your-org-id'::uuid, 
  '2025-10-20'::date, 
  true  -- is_admin
);

-- Should return slots from 00:00 to 23:30 with is_business_hours flag
```

### 3. Test Admin Flow
1. Open application
2. Navigate to Admin Meetings Modal
3. Click Settings, toggle 24-hour format
4. Save and verify update
5. Select different date, verify slots display correctly
6. Verify business hours highlighting

## Benefits

### For Admins
- ✅ Full 24-hour access to schedule meetings
- ✅ Visual indication of customer booking hours
- ✅ Choice of time format (24h/12h)
- ✅ Clear timezone context
- ✅ Organization-wide preference (no per-device config)

### For Developers
- ✅ Server-side preference storage
- ✅ Consistent data model (removed redundant fields)
- ✅ Type-safe implementation
- ✅ Backward compatible props
- ✅ Clean separation of concerns

### For Users (Customers)
- ✅ Only see appropriate booking hours
- ✅ Clear time display with timezone
- ✅ No confusion about available times

## Future Enhancements

Potential improvements:
1. Per-user format preference (override org default)
2. Timezone selector (override browser detection)
3. Custom slot colors for different meeting types
4. Visual calendar heatmap showing busy hours
5. Export admin schedule as ICS/Calendar file

## Troubleshooting

### Business Hours Not Highlighting
- Check API response includes `is_business_hours` or `isBusinessHours`
- Verify `MeetingsAdminModal` maps field correctly (line ~170)
- Check `BookingForm` receives `isAdmin={true}` prop

### 24-Hour Format Not Persisting
- Verify `is_24_hours` saved to database via API
- Check Settings Modal saves successfully
- Verify Admin Modal reloads on Settings Modal close

### GMT Offset Wrong
- Check browser timezone settings
- Verify `getTimezoneOffset()` calculation
- Test in different timezones

### Migration Errors
- Ensure PostgreSQL version supports `DROP COLUMN IF EXISTS`
- Check for existing bookings or foreign key constraints
- Run migration during low-traffic period

## References

- Migration file: `database/migrations/008_simplify_admin_scheduling.sql`
- API endpoint: `/api/meetings/settings`
- Type definitions: `src/types/meetings.ts`
- Main components:
  - `MeetingsAdminModal.tsx`
  - `MeetingsSettingsModal.tsx`
  - `BookingForm.tsx`
