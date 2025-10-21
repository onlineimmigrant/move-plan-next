# Deployment Steps - Admin 24-Hour Format & Business Hours Highlighting

## Pre-Deployment Checklist

- [ ] Code changes committed to repository
- [ ] TypeScript compilation successful (no errors)
- [ ] Database migration file ready: `008_simplify_admin_scheduling.sql`
- [ ] Backup of current database taken
- [ ] Test plan reviewed

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Navigate to SQL Editor**
   - Select your project
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Paste Migration SQL**
   - Open `database/migrations/008_simplify_admin_scheduling.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Review Migration**
   - Check that it will:
     - Drop columns: `admin_24hour_scheduling`, `admin_slot_start`, `admin_slot_end`
     - Update `get_available_time_slots()` function
     - Add `is_business_hours` flag to slot results

5. **Execute Migration**
   - Click "Run" button
   - Wait for success message
   - Review results in output panel

### Option B: Via psql Command Line

```bash
# Set your database connection string
export DATABASE_URL="your_database_connection_string"

# Apply migration
psql $DATABASE_URL -f database/migrations/008_simplify_admin_scheduling.sql

# Verify success
psql $DATABASE_URL -c "\d organization_meeting_settings"
```

### Option C: Via Supabase CLI

```bash
# Make sure Supabase CLI is installed and logged in
supabase db push

# Or apply specific migration
supabase migration up 008_simplify_admin_scheduling
```

## Step 2: Verify Migration

### Check Table Structure

```sql
-- View table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organization_meeting_settings'
ORDER BY ordinal_position;

-- Should include:
-- - is_24_hours (boolean)
-- Should NOT include:
-- - admin_24hour_scheduling
-- - admin_slot_start
-- - admin_slot_end
```

### Test PostgreSQL Function

```sql
-- Replace 'your-org-id' with actual organization UUID
SELECT 
  slot_start::time as time,
  is_available,
  is_business_hours
FROM get_available_time_slots(
  'your-org-id'::uuid,
  CURRENT_DATE,
  true  -- is_admin
)
ORDER BY slot_start
LIMIT 10;

-- Expected output:
-- time     | is_available | is_business_hours
-- ---------|--------------|------------------
-- 00:00:00 | t            | f
-- 00:30:00 | t            | f
-- 01:00:00 | t            | f
-- ...
-- 09:00:00 | t            | t  ← Business hours start
-- 09:30:00 | t            | t
-- 10:00:00 | t            | t
```

### Check Existing Settings

```sql
-- View current organization settings
SELECT 
  organization_id,
  slot_duration_minutes,
  business_hours_start,
  business_hours_end,
  is_24_hours,
  available_days
FROM organization_meeting_settings
LIMIT 5;

-- Note: is_24_hours will be NULL for existing records
-- Default to true in application code
```

## Step 3: Deploy Application Code

### Option A: Vercel/Production Deploy

```bash
# Commit all changes
git add .
git commit -m "feat: Add server-side 24h format preference and business hours highlighting for admins"

# Push to main branch (triggers Vercel deploy)
git push origin main

# Or create pull request for review
git checkout -b feature/admin-24h-format
git push origin feature/admin-24h-format
```

### Option B: Manual Next.js Build

```bash
# Install dependencies (if needed)
pnpm install

# Build application
pnpm build

# Start production server
pnpm start

# Or development server
pnpm dev
```

## Step 4: Testing Procedures

### Test 1: Settings Modal - 24-Hour Toggle

**Steps:**
1. Login as admin user
2. Open "Admin: Schedule Meeting" modal
3. Click "Settings" button (⚙️)
4. Locate "Use 24-Hour Time Format" toggle
5. Toggle to ON (blue)
6. Click "Save"
7. Modal should close

**Expected:**
- ✅ Toggle animates smoothly
- ✅ Save succeeds without errors
- ✅ Success message appears briefly
- ✅ Modal closes automatically

**Verification:**
```sql
-- Check database value
SELECT is_24_hours 
FROM organization_meeting_settings 
WHERE organization_id = 'your-org-id';

-- Should return: true
```

### Test 2: Time Slot Display - 24-Hour Format

**Steps:**
1. Open "Admin: Schedule Meeting" modal
2. Click on any date in calendar
3. View time slot selection

**Expected:**
- ✅ Header shows "24-hour format • Your time: GMT±XX:XX"
- ✅ Times displayed as "00:00", "01:00", "13:00", "23:30"
- ✅ No AM/PM indicators
- ✅ All 48 slots visible (00:00 - 23:30 for 30min duration)

### Test 3: Time Slot Display - 12-Hour Format

**Steps:**
1. Open Settings modal
2. Toggle "Use 24-Hour Time Format" to OFF
3. Save
4. Return to time slot selection

**Expected:**
- ✅ Header shows "12-hour format • Your time: GMT±XX:XX"
- ✅ Times displayed as "12:00 AM", "1:00 AM", "1:00 PM", "11:30 PM"
- ✅ AM/PM indicators present
- ✅ All 48 slots still visible

### Test 4: Business Hours Highlighting

**Prerequisite:** Set business hours to 09:00 - 17:00 in Settings

**Steps:**
1. Open Admin: Schedule Meeting
2. Select today's date
3. View time slot grid

**Expected:**
- ✅ Slots from 00:00 - 08:30: White background, no badge
- ✅ Slots from 09:00 - 16:30: Cyan background, "Customer Hours" badge
- ✅ Slots from 17:00 - 23:30: White background, no badge
- ✅ Header shows "Customer hours: 09:00 - 17:00 (highlighted)"

**Badge Test:**
- ✅ Hover over "Customer Hours" badge
- ✅ Tooltip appears: "This time slot is within customer booking hours"

### Test 5: GMT Offset Display

**Steps:**
1. View time slot selection
2. Check header info

**Expected:**
- ✅ Shows correct GMT offset for your timezone
- ✅ Format: GMT+XX:XX or GMT-XX:XX
- ✅ Example: GMT+02:00, GMT-05:00, GMT+00:00

**Verification:**
```javascript
// In browser console
const offset = -new Date().getTimezoneOffset() / 60;
console.log(`Your offset: ${offset}`);
// Compare with displayed value
```

### Test 6: Slot Selection & Booking

**Steps:**
1. Select a slot **outside** business hours (e.g., 22:00)
2. Fill in meeting details:
   - Meeting type: Any
   - Customer name: Test User
   - Customer email: test@example.com
3. Click "Schedule Meeting"

**Expected:**
- ✅ Slot is selectable (not disabled)
- ✅ Form submits successfully
- ✅ Booking created in database
- ✅ Success message appears
- ✅ Modal closes

**Verification:**
```sql
-- Check booking was created
SELECT 
  scheduled_at,
  customer_name,
  customer_email,
  status
FROM bookings
WHERE customer_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 7: Customer View (Should Not See Admin Slots)

**Steps:**
1. Logout as admin
2. Open customer booking page
3. Select same date
4. View available slots

**Expected:**
- ✅ Only business hours visible (09:00 - 17:00)
- ✅ Admin booking at 22:00 NOT visible
- ✅ No "Customer Hours" badges (not needed in customer view)
- ✅ Format based on customer preference (default 12h)

### Test 8: Settings Persistence

**Steps:**
1. Toggle 24-hour format to ON
2. Save
3. Refresh browser page
4. Open Admin modal again

**Expected:**
- ✅ Format remains 24-hour (not reset)
- ✅ Settings loaded from database (not localStorage)
- ✅ Consistent across different devices/browsers

### Test 9: Responsive Design

**Steps:**
1. Open Admin modal on mobile device (or DevTools mobile view)
2. View time slot selection

**Expected:**
- ✅ Header info wraps properly on small screens
- ✅ Time slot grid adapts (2 columns on mobile)
- ✅ Business hours info stacks vertically
- ✅ "Customer Hours" badges remain visible
- ✅ Touch targets are large enough (>44px)

### Test 10: API Integration

**Steps:**
1. Open browser DevTools → Network tab
2. Open Admin modal
3. Monitor API calls

**Expected API Calls:**
```
GET /api/meetings/settings?organization_id=xxx
Response: { ..., "is_24_hours": true }

GET /api/meetings/available-slots?organization_id=xxx&date=2025-10-20&is_admin=true
Response: { "slots": [...], "settings": { "is_admin_mode": true, ... } }
```

**Verify:**
- ✅ Settings API returns `is_24_hours` field
- ✅ Available slots API returns `is_business_hours` flag
- ✅ No 404 or 500 errors
- ✅ Response times acceptable (<500ms)

## Step 5: Performance Verification

### Check Query Performance

```sql
-- Test function performance
EXPLAIN ANALYZE
SELECT * FROM get_available_time_slots(
  'your-org-id'::uuid,
  CURRENT_DATE,
  true
);

-- Should complete in <50ms
-- Check for any sequential scans that could be indexed
```

### Monitor Error Logs

```bash
# Check Next.js logs
pnpm logs

# Or in Vercel Dashboard:
# - Select project
# - Go to "Logs" tab
# - Filter by error level
```

## Step 6: Rollback Plan (If Needed)

### If Migration Causes Issues

```sql
-- Rollback: Re-add dropped columns with defaults
ALTER TABLE organization_meeting_settings
ADD COLUMN admin_24hour_scheduling BOOLEAN DEFAULT false,
ADD COLUMN admin_slot_start TIME DEFAULT '00:00:00',
ADD COLUMN admin_slot_end TIME DEFAULT '23:59:59';

-- Restore old function (backup should be in git history)
-- Copy from previous migration or git history
```

### If Code Issues

```bash
# Revert to previous commit
git revert HEAD

# Push to trigger redeployment
git push origin main
```

## Step 7: Post-Deployment Monitoring

### Day 1-3 Checklist

- [ ] Monitor error rates in production
- [ ] Check database query performance
- [ ] Verify no customer complaints about booking
- [ ] Confirm admin users can access all features
- [ ] Review analytics for booking patterns

### Metrics to Watch

```sql
-- Booking success rate
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*), 2) as success_rate
FROM bookings
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Admin vs customer bookings
SELECT 
  CASE 
    WHEN scheduled_at::time >= business_hours_start 
     AND scheduled_at::time < business_hours_end 
    THEN 'Business Hours'
    ELSE 'Outside Hours (Admin)'
  END as booking_type,
  COUNT(*) as count
FROM bookings b
JOIN organization_meeting_settings s ON b.organization_id = s.organization_id
WHERE b.created_at > NOW() - INTERVAL '7 days'
GROUP BY booking_type;
```

## Troubleshooting Guide

### Issue: "Column 'is_24_hours' does not exist"

**Solution:**
```sql
-- Add column manually
ALTER TABLE organization_meeting_settings 
ADD COLUMN is_24_hours BOOLEAN DEFAULT true;
```

### Issue: Business hours not highlighting

**Check:**
1. API response includes `is_business_hours` field
2. Business hours are set in settings (not NULL)
3. Frontend maps field correctly (snake_case vs camelCase)

**Debug:**
```javascript
// In browser console
console.log(availableSlots[0]);
// Should show: { start, end, available, isBusinessHours }
```

### Issue: 24-hour format not persisting

**Check:**
1. Database column exists: `SELECT is_24_hours FROM organization_meeting_settings LIMIT 1`
2. API saves successfully: Check Network tab for PUT request
3. Admin modal reloads after save: Check `loadData()` call in onClose

### Issue: Wrong GMT offset

**Cause:** Browser timezone detection issue

**Solution:**
```javascript
// Test in browser console
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log(new Date().getTimezoneOffset());
// Compare with OS timezone settings
```

## Success Criteria

✅ **Migration Applied Successfully**
- [ ] No SQL errors
- [ ] Old columns dropped
- [ ] Function updated
- [ ] Database backup taken

✅ **Feature Working**
- [ ] 24-hour toggle in Settings Modal
- [ ] Format persists across sessions
- [ ] Time slots display correctly
- [ ] Business hours highlighted
- [ ] GMT offset shown
- [ ] Admins can book any slot
- [ ] Customers see only business hours

✅ **Performance Acceptable**
- [ ] Page load < 3 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks
- [ ] Mobile responsive

✅ **No Regressions**
- [ ] Customer booking still works
- [ ] Calendar displays correctly
- [ ] Other features unaffected
- [ ] No console errors

## Next Steps

After successful deployment:

1. **Announce to Team**
   - Inform admins of new 24-hour feature
   - Share quick reference guide
   - Provide training if needed

2. **Gather Feedback**
   - Monitor support tickets
   - Ask admins for UX feedback
   - Track usage patterns

3. **Iterate**
   - Consider per-user preferences
   - Add more timezone features
   - Enhance visual indicators

## Documentation Links

- Implementation Details: `docs/ADMIN_24HOUR_FORMAT_IMPLEMENTATION.md`
- Quick Reference: `docs/ADMIN_SCHEDULING_QUICK_REFERENCE.md`
- Migration File: `database/migrations/008_simplify_admin_scheduling.sql`
- API Documentation: `/api/meetings/*`

## Support Contacts

If issues arise:
- Check documentation first
- Review error logs in Vercel/Supabase
- Open GitHub issue with details
- Contact development team

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
**Status:** ⬜ Success ⬜ Partial ⬜ Rollback Required
