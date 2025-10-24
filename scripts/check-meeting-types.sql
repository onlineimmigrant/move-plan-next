-- Diagnostic script to check meeting types setup
-- Run this in Supabase SQL Editor

-- Check if meeting_types table exists and has data
SELECT 
  'Meeting Types Count' as check_name,
  COUNT(*) as count
FROM meeting_types;

-- Show all meeting types with their settings
SELECT 
  id,
  organization_id,
  name,
  duration_minutes,
  is_active,
  is_customer_choice,
  created_at
FROM meeting_types
ORDER BY organization_id, name;

-- Check if there are active customer-choice types
SELECT 
  organization_id,
  COUNT(*) as total_types,
  COUNT(*) FILTER (WHERE is_active = true) as active_types,
  COUNT(*) FILTER (WHERE is_customer_choice = true) as customer_choice_types,
  COUNT(*) FILTER (WHERE is_active = true AND is_customer_choice = true) as active_customer_types
FROM meeting_types
GROUP BY organization_id;

-- If no meeting types exist, here's a query to create default ones:
-- Uncomment and modify organization_id to your actual organization ID

/*
INSERT INTO meeting_types (organization_id, name, duration_minutes, description, is_active, is_customer_choice)
VALUES
  ('YOUR_ORGANIZATION_ID_HERE', 'Quick Call', 15, '15-minute quick consultation', true, true),
  ('YOUR_ORGANIZATION_ID_HERE', 'Standard Meeting', 30, '30-minute standard meeting', true, true),
  ('YOUR_ORGANIZATION_ID_HERE', 'Extended Session', 60, '1-hour extended session', true, true),
  ('YOUR_ORGANIZATION_ID_HERE', 'Instant Meeting', 30, 'Instant ad-hoc meeting', true, false);
*/
