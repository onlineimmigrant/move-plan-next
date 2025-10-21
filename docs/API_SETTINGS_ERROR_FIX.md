# API Settings Error Fix - PGRST204

## Error
```
Error updating meeting settings: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'settings' column of 'organization_meeting_settings' in the schema cache"
}
PUT /api/meetings/settings 500 in 333ms
```

## Root Cause

The error occurred because:
1. The API was trying to insert/update fields that don't exist in the table
2. The response structure was inconsistent between GET and PUT
3. Auto-generated fields (id, created_at) were being sent in the update

## Database Schema

Actual table columns in `organization_meeting_settings`:
```sql
- id (auto-generated UUID)
- organization_id (foreign key)
- slot_duration_minutes (15/30/45/60)
- business_hours_start (TIME)
- business_hours_end (TIME)
- admin_24hour_scheduling (BOOLEAN)
- admin_slot_start (TIME)
- admin_slot_end (TIME)
- available_days (JSONB array)
- min_booking_notice_hours (INTEGER)
- max_booking_days_ahead (INTEGER)
- default_buffer_minutes (INTEGER)
- default_timezone (VARCHAR)
- auto_confirm_bookings (BOOLEAN)
- created_at (auto-generated)
- updated_at (auto-generated)
```

## Fixes Applied

### 1. GET Endpoint Response Structure
**Before:**
```typescript
return NextResponse.json({
  settings: settings || defaultSettings,
});
```

**After:**
```typescript
return NextResponse.json(
  settings || defaultSettings
);
```
✅ Now returns settings object directly instead of wrapped in `{ settings: {...} }`

### 2. PUT Endpoint - Filter Auto-Generated Fields
**Before:**
```typescript
const { organization_id, ...settingsData } = body;

await supabase
  .from('organization_meeting_settings')
  .upsert({
    organization_id,
    ...settingsData,  // ❌ Might include id, created_at
    updated_at: new Date().toISOString(),
  })
```

**After:**
```typescript
const { organization_id, id, created_at, ...settingsData } = body;

// Build clean object with only valid fields
const cleanSettings = {
  organization_id,
  updated_at: new Date().toISOString(),
};

// Add each field individually if defined
if (settingsData.slot_duration_minutes !== undefined) {
  cleanSettings.slot_duration_minutes = settingsData.slot_duration_minutes;
}
// ... (repeat for all valid fields)

await supabase
  .from('organization_meeting_settings')
  .upsert(cleanSettings)
```

✅ Explicitly filters out `id` and `created_at`
✅ Only includes defined fields
✅ Ensures type safety

### 3. Better Error Details
**Added:**
```typescript
return NextResponse.json(
  { error: 'Failed to update meeting settings', details: error },
  { status: 500 }
);
```
✅ Now returns full error details for debugging

## Testing

The API should now:
1. ✅ GET settings - Returns flat object with all fields
2. ✅ PUT settings - Only updates valid, defined fields
3. ✅ Properly handle upsert (insert if missing, update if exists)
4. ✅ Not try to update auto-generated fields
5. ✅ Return better error messages

## Verification Steps

1. **Test GET:**
   ```bash
   curl "http://localhost:3000/api/meetings/settings?organization_id=YOUR_ORG_ID"
   ```
   Should return settings object directly (not wrapped)

2. **Test PUT:**
   ```bash
   curl -X PUT "http://localhost:3000/api/meetings/settings" \
     -H "Content-Type: application/json" \
     -d '{
       "organization_id": "YOUR_ORG_ID",
       "admin_24hour_scheduling": true,
       "slot_duration_minutes": 30
     }'
   ```
   Should return: `{ success: true, settings: {...}, message: "Settings updated successfully" }`

3. **Test in UI:**
   - Open Settings Modal
   - Toggle 24-hour scheduling
   - Click Save
   - Should see green success message

## Files Modified

- `/src/app/api/meetings/settings/route.ts` - Fixed GET/PUT endpoints

## Related Error Codes

- **PGRST204**: Column not found in schema cache
  - Usually means trying to insert/update non-existent columns
  - Fixed by filtering fields to only valid table columns

---

**Status**: ✅ Fixed  
**Date**: October 20, 2025
