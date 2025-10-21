# 24-Hour Admin Scheduling - Quick Reference

## 🚀 Quick Start

### 1. Apply Migration
```bash
psql -d your_database -f database/migrations/007_add_admin_time_slot_config.sql
```

### 2. Enable 24-Hour Mode
```sql
UPDATE organization_meeting_settings 
SET admin_24hour_scheduling = true 
WHERE organization_id = 'your-org-id';
```

### 3. Test
Open admin modal → Select a date → See 48 time slots! 🎉

---

## 📊 Slot Count Reference

| Duration | 24-Hour Mode | Business Hours (9-5) |
|----------|--------------|----------------------|
| 15 min   | 96 slots     | 32 slots            |
| 30 min   | 48 slots     | 16 slots            |
| 45 min   | 32 slots     | 11 slots            |
| 60 min   | 24 slots     | 8 slots             |

---

## 🔌 API Endpoints

### Get Settings
```bash
GET /api/meetings/settings?organization_id=xxx
```

### Update Settings
```bash
PUT /api/meetings/settings
Body: { "organization_id": "xxx", "admin_24hour_scheduling": true }
```

### Get Time Slots
```bash
# Admin (24-hour if enabled)
GET /api/meetings/available-slots?organization_id=xxx&date=2025-10-27&is_admin=true

# Customer (business hours only)
GET /api/meetings/available-slots?organization_id=xxx&date=2025-10-27&is_admin=false
```

---

## 🎨 Components

| Component | Purpose | Admin Mode |
|-----------|---------|------------|
| `MeetingsAdminModal` | Admin scheduling | ✅ 24-hour |
| `MeetingsBookingModal` | Customer booking | ❌ Business hours |
| `MeetingsSettingsModal` | Configure settings | ⚙️ Config UI |

---

## 🗄️ Database Tables

### organization_meeting_settings
```sql
admin_24hour_scheduling BOOLEAN  -- Enable/disable
admin_slot_start TIME            -- Start (e.g., '00:00:00')
admin_slot_end TIME              -- End (e.g., '23:59:59')
business_hours_start TIME        -- Customer start
business_hours_end TIME          -- Customer end
slot_duration_minutes INTEGER    -- 15/30/45/60
```

### custom_availability_overrides
```sql
override_date DATE               -- Specific date
override_type VARCHAR            -- available/unavailable/custom
custom_start_time TIME           -- Override start
custom_end_time TIME             -- Override end
```

---

## 🔒 Security

- ✅ RLS policies enabled
- ✅ Only admins can modify settings (`role='admin'`)
- ✅ Organization membership validated
- ✅ Service role key for API routes

---

## 🐛 Troubleshooting

**Problem:** Not seeing 48 slots  
**Fix:** Check `admin_24hour_scheduling = true` in database

**Problem:** Customer seeing 24-hour slots  
**Fix:** Ensure `is_admin=false` in API call

**Problem:** TypeScript errors  
**Fix:** All resolved! Run `npm run build` to verify

---

## 📖 Documentation

- **Full Guide:** `docs/features/24_HOUR_ADMIN_SCHEDULING.md`
- **Implementation:** `docs/IMPLEMENTATION_SUMMARY.md`
- **Migration:** `database/migrations/007_add_admin_time_slot_config.sql`

---

## ✅ Verification

```bash
# Run test script
node scripts/test-24hour-scheduling.js your-org-id

# Check database
SELECT admin_24hour_scheduling FROM organization_meeting_settings 
WHERE organization_id = 'your-org-id';

# Test API
curl "http://localhost:3000/api/meetings/available-slots?organization_id=xxx&date=2025-10-27&is_admin=true"
```

---

## 🎯 Configuration Examples

### Full 24-Hour
```json
{
  "admin_24hour_scheduling": true,
  "admin_slot_start": "00:00:00",
  "admin_slot_end": "23:59:59",
  "slot_duration_minutes": 30
}
```

### Extended Hours (6 AM - 10 PM)
```json
{
  "admin_24hour_scheduling": true,
  "admin_slot_start": "06:00:00",
  "admin_slot_end": "22:00:00",
  "slot_duration_minutes": 30
}
```

### Night Shift
```json
{
  "admin_24hour_scheduling": true,
  "admin_slot_start": "22:00:00",
  "admin_slot_end": "06:00:00",
  "slot_duration_minutes": 60
}
```

---

**Status:** ✅ Production Ready  
**Date:** October 20, 2025
