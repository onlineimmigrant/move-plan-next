-- Quick diagnostic script to check if waiting room migration is applied
-- Run this in Supabase SQL Editor

-- 1. Check if 'waiting' status exists in the enum
SELECT 'Checking booking_status enum...' as step;
SELECT enumlabel as available_statuses
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'booking_status';

-- Expected: Should see 'waiting' in the list along with:
-- scheduled, confirmed, in_progress, completed, cancelled, no_show

-- 2. Check if new columns exist
SELECT '' as separator;
SELECT 'Checking waiting room columns...' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('waiting_since', 'approved_by', 'rejected_by', 'approved_at', 'rejected_at', 'rejection_reason')
ORDER BY column_name;

-- Expected: Should see all 6 columns
-- waiting_since | timestamp with time zone | YES
-- approved_by | uuid | YES
-- approved_at | timestamp with time zone | YES
-- rejected_by | uuid | YES
-- rejected_at | timestamp with time zone | YES
-- rejection_reason | text | YES

-- 3. Check constraints
SELECT '' as separator;
SELECT 'Checking constraints...' as step;
SELECT conname as constraint_name
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND conname LIKE '%status%';

-- Expected: Should see bookings_status_check

-- 4. Check indexes
SELECT '' as separator;
SELECT 'Checking indexes...' as step;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
AND indexname LIKE '%waiting%';

-- Expected: Should see idx_bookings_waiting_status

-- RESULT INTERPRETATION:
-- If all queries return expected results: ✅ Migration is applied correctly!
-- If any query returns no rows or is missing items: ❌ Migration needs to be applied
-- To apply: Copy contents of /migrations/add_waiting_status_to_bookings.sql and run in SQL Editor
