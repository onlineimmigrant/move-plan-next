-- =====================================================
-- QUICK FIX - Temporarily disable RLS for testing
-- =====================================================
-- Run this ONLY for testing - you can re-enable RLS later
-- =====================================================

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE organization_activities DISABLE ROW LEVEL SECURITY;

-- Check that activities are now visible
SELECT 'Activities visible after disabling RLS:' as test;
SELECT 
    id,
    action,
    details,
    user_email,
    created_at
FROM organization_activities 
ORDER BY created_at DESC;

-- If you want to re-enable RLS later, uncomment this:
-- ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;
