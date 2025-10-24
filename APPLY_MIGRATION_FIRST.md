# 🚨 CRITICAL: Apply Database Migration

## The waiting room feature will NOT work until you apply this migration!

---

## Quick Start - Apply Migration via Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in left sidebar

3. **Create New Query**
   - Click **New Query** button

4. **Copy Migration SQL**
   - Open file: `/migrations/add_waiting_status_to_bookings.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

5. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run** button (or Ctrl+Enter)

6. **Verify Success**
   - Should see "Success. No rows returned" message
   - Run verification query below

---

## Verification Query

Run this in SQL Editor to confirm migration worked:

```sql
-- Check if 'waiting' status exists
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'booking_status';

-- Expected output should include: 
-- scheduled, confirmed, waiting, in_progress, completed, cancelled, no_show
```

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('waiting_since', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'rejection_reason');

-- Expected output should show all 6 columns:
-- waiting_since | timestamp with time zone
-- approved_by | uuid
-- approved_at | timestamp with time zone  
-- rejected_by | uuid
-- rejected_at | timestamp with time zone
-- rejection_reason | text
```

---

## Alternative: Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (one time setup)
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

---

## What This Migration Does

1. **Adds 'waiting' to booking_status enum**
   - Allows bookings to have 'waiting' status
   - Used when customer enters waiting room

2. **Adds 6 new columns to bookings table:**
   - `waiting_since` - Timestamp when customer entered waiting room
   - `approved_by` - UUID of user who approved (host/admin)
   - `approved_at` - Timestamp of approval
   - `rejected_by` - UUID of user who rejected
   - `rejected_at` - Timestamp of rejection  
   - `rejection_reason` - Optional text reason for rejection

3. **Adds foreign key constraints**
   - Links approved_by and rejected_by to profiles table

4. **Creates index**
   - Index on status column for fast waiting room queries

---

## Troubleshooting

### Error: "type 'booking_status' already exists"

**Solution:** The migration was partially applied. Run this cleanup first:

```sql
-- Check current enum values
SELECT unnest(enum_range(NULL::booking_status));

-- If 'waiting' is missing, add it:
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'waiting';
```

### Error: "column 'waiting_since' already exists"

**Solution:** Columns were already added. Just verify they exist:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('waiting_since', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'rejection_reason');
```

If all 6 columns show up, your migration is already applied! ✅

### Error: "relation 'bookings' does not exist"

**Solution:** Wrong database. Make sure you're connected to the correct Supabase project where your bookings table exists.

---

## After Migration

Once migration is applied, test the waiting room:

1. **Create a test booking** scheduled 5 minutes from now
2. **As customer:** Navigate to meeting link before scheduled time
3. **Should see:** Waiting room screen with animated waiting indicator
4. **As admin:** Open Meetings admin panel
5. **Should see:** Waiting participant in WaitingRoomControls panel
6. **Click:** "Admit" button to approve

✅ If customer proceeds to video call, waiting room is working!

---

## Need Help?

See full documentation: `/docs/WAITING_ROOM_AND_INSTANT_MEETINGS_COMPLETE.md`
