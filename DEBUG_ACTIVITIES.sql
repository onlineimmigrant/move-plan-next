-- =====================================================
-- DEBUG SCRIPT - Run this to troubleshoot activity fetching
-- =====================================================
-- Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/sql
-- =====================================================

-- Step 1: Check if the table exists and has data
SELECT 'organization_activities table check:' as debug_step;
SELECT 
    COUNT(*) as total_activities,
    MIN(created_at) as oldest_activity,
    MAX(created_at) as newest_activity
FROM organization_activities;

-- Step 2: Show all activities (to verify data)
SELECT 'All activities in database:' as debug_step;
SELECT 
    id,
    organization_id,
    action,
    details,
    user_email,
    created_at
FROM organization_activities 
ORDER BY created_at DESC;

-- Step 3: Check RLS policies
SELECT 'RLS policies check:' as debug_step;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'organization_activities';

-- Step 4: Check if RLS is enabled
SELECT 'RLS status check:' as debug_step;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'organization_activities';

-- Step 5: Check organizations table (if exists)
SELECT 'Organizations table check:' as debug_step;
SELECT 
    id,
    name,
    type,
    created_by_email
FROM organizations
ORDER BY created_at DESC
LIMIT 5;

-- Step 6: Test if we can select from activities without RLS
-- (This simulates what the API should see)
SELECT 'Direct select test:' as debug_step;
SET row_security = off;
SELECT COUNT(*) as activities_without_rls FROM organization_activities;
SET row_security = on;
