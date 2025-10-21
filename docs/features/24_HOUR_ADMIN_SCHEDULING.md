# 24-Hour Admin Scheduling

## Overview

Admins can now define meeting time slots across a full 24-hour period, enabling scheduling flexibility beyond standard business hours. This feature allows up to 48 thirty-minute time slots (or fewer with longer durations) throughout the day.

## Architecture

### Database Schema

#### `organization_meeting_settings` Table
Stores meeting configuration per organization:

```sql
CREATE TABLE organization_meeting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Admin 24-hour scheduling
  admin_24hour_scheduling BOOLEAN DEFAULT false,
  admin_slot_start TIME DEFAULT '00:00:00',
  admin_slot_end TIME DEFAULT '23:59:59',
  
  -- Regular business hours (for customer bookings)
  business_hours_start TIME DEFAULT '09:00:00',
  business_hours_end TIME DEFAULT '17:00:00',
  
  -- Slot configuration
  slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes IN (15, 30, 45, 60)),
  available_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Mon-Fri
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `custom_availability_overrides` Table
Date-specific availability exceptions:

```sql
CREATE TABLE custom_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  override_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  custom_start_time TIME,
  custom_end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### GET `/api/meetings/settings`
Fetches organization meeting settings.

**Query Parameters:**
- `organization_id` (required): Organization UUID

**Response:**
```json
{
  "organization_id": "uuid",
  "admin_24hour_scheduling": false,
  "admin_slot_start": "00:00:00",
  "admin_slot_end": "23:59:59",
  "business_hours_start": "09:00:00",
  "business_hours_end": "17:00:00",
  "slot_duration_minutes": 30,
  "available_days": [1, 2, 3, 4, 5]
}
```

#### PUT `/api/meetings/settings`
Updates organization meeting settings.

**Body:**
```json
{
  "organization_id": "uuid",
  "admin_24hour_scheduling": true,
  "admin_slot_start": "00:00:00",
  "admin_slot_end": "23:59:59",
  "slot_duration_minutes": 30
}
```

#### GET `/api/meetings/available-slots`
Fetches available time slots for a specific date.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `date` (required): Date in YYYY-MM-DD format
- `is_admin` (optional): Boolean, determines admin vs customer hours

**Response:**
```json
{
  "slots": [
    {
      "start": "2025-01-20T00:00:00.000Z",
      "end": "2025-01-20T00:30:00.000Z",
      "available": true
    },
    // ... up to 48 slots for 24-hour mode
  ],
  "settings": {
    "slot_duration_minutes": 30,
    "start_time": "00:00",
    "end_time": "23:59",
    "is_admin_mode": true
  }
}
```

## Frontend Integration

### MeetingsAdminModal Component

The admin modal now dynamically fetches time slots based on organization settings:

```typescript
const loadAvailableSlots = async (date: Date) => {
  if (!settings?.organization_id) return;

  const formattedDate = date.toISOString().split('T')[0];
  
  // Fetch with is_admin=true to get 24-hour slots if enabled
  const response = await fetch(
    `/api/meetings/available-slots?organization_id=${settings.organization_id}&date=${formattedDate}&is_admin=true`
  );

  const data = await response.json();
  
  // Convert ISO strings to Date objects
  const slots = data.slots.map(slot => ({
    start: new Date(slot.start),
    end: new Date(slot.end),
    available: slot.available,
  }));

  setAvailableSlots(slots);
};
```

### Behavior

1. **Admin Mode (`is_admin=true`)**
   - If `admin_24hour_scheduling` is enabled: Uses `admin_slot_start` to `admin_slot_end`
   - If disabled: Falls back to `business_hours_start` to `business_hours_end`

2. **Customer Mode (`is_admin=false`)**
   - Always uses `business_hours_start` to `business_hours_end`
   - Respects `available_days` configuration

## Setup Instructions

### 1. Apply Database Migration

Run the migration script:

```bash
# Using psql
psql -d your_database -f database/migrations/007_add_admin_time_slot_config.sql

# Or using Supabase CLI
supabase db push
```

### 2. Enable 24-Hour Scheduling

Update organization settings via API:

```typescript
await fetch('/api/meetings/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'your-org-id',
    admin_24hour_scheduling: true,
    admin_slot_start: '00:00:00',
    admin_slot_end: '23:59:59',
    slot_duration_minutes: 30,
  }),
});
```

### 3. Verify Time Slots

Open the admin meetings modal and select a date. You should see:
- **30-minute slots**: 48 time slots from 00:00 to 23:30
- **15-minute slots**: 96 time slots
- **60-minute slots**: 24 time slots

## Configuration Examples

### Standard Business Hours (Default)
```json
{
  "admin_24hour_scheduling": false,
  "business_hours_start": "09:00:00",
  "business_hours_end": "17:00:00",
  "slot_duration_minutes": 30
}
```
**Result:** 16 slots from 9 AM to 5 PM

### Full 24-Hour Scheduling
```json
{
  "admin_24hour_scheduling": true,
  "admin_slot_start": "00:00:00",
  "admin_slot_end": "23:59:59",
  "slot_duration_minutes": 30
}
```
**Result:** 48 slots covering entire day

### Extended Hours (6 AM - 10 PM)
```json
{
  "admin_24hour_scheduling": true,
  "admin_slot_start": "06:00:00",
  "admin_slot_end": "22:00:00",
  "slot_duration_minutes": 30
}
```
**Result:** 32 slots from 6 AM to 10 PM

### Night Shift (10 PM - 6 AM)
```json
{
  "admin_24hour_scheduling": true,
  "admin_slot_start": "22:00:00",
  "admin_slot_end": "06:00:00",
  "slot_duration_minutes": 60
}
```
**Result:** 8 slots for overnight scheduling

## Security

### Row Level Security (RLS)

The settings tables are protected with RLS policies:

```sql
-- Only authenticated users from the same organization can read settings
CREATE POLICY "Users can view own organization settings"
ON organization_meeting_settings FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles
    WHERE user_id = auth.uid()
  )
);

-- Only admins can update settings
CREATE POLICY "Admins can update organization settings"
ON organization_meeting_settings FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
```

### API Access

- Settings endpoint uses Supabase service role key
- Organization ID is validated against user's session
- RLS policies enforced at database level

## Future Enhancements

- [ ] Admin UI for configuring 24-hour settings
- [ ] Per-user availability schedules
- [ ] Timezone support and conversion
- [ ] Recurring availability patterns (e.g., "Mondays 8 PM - midnight")
- [ ] Holiday calendar integration
- [ ] Multiple meeting types with different hours
- [ ] Buffer time between meetings
- [ ] Auto-decline out-of-hours customer requests

## Troubleshooting

### No Time Slots Appearing

1. Check organization settings exist:
```sql
SELECT * FROM organization_meeting_settings 
WHERE organization_id = 'your-org-id';
```

2. Verify admin flag is enabled:
```sql
UPDATE organization_meeting_settings 
SET admin_24hour_scheduling = true
WHERE organization_id = 'your-org-id';
```

3. Check console logs for API errors

### Limited Time Slots (Still Seeing 9-5)

- Ensure `is_admin=true` is passed to the API
- Verify `admin_24hour_scheduling` is set to `true` in database
- Clear browser cache and reload

### Booking Conflicts

The system automatically checks for existing bookings:
```sql
SELECT * FROM bookings 
WHERE organization_id = 'your-org-id' 
AND scheduled_at >= '2025-01-20 00:00:00'
AND scheduled_at < '2025-01-20 23:59:59'
AND status NOT IN ('cancelled', 'no_show');
```

## Migration File

Location: `database/migrations/007_add_admin_time_slot_config.sql`

Key components:
- Table creation with proper constraints
- Indexes for performance
- RLS policies for security
- `get_available_time_slots()` function
- Default data for existing organizations
- Comprehensive comments

## Related Files

- `/src/app/api/meetings/settings/route.ts` - Settings API endpoint
- `/src/app/api/meetings/available-slots/route.ts` - Time slots API endpoint
- `/src/components/modals/MeetingsModals/MeetingsAdminModal/MeetingsAdminModal.tsx` - Admin UI
- `database/migrations/007_add_admin_time_slot_config.sql` - Database schema

---

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Author:** System Architecture Team
