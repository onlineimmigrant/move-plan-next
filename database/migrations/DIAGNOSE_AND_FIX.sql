-- ============================================================================
-- DIAGNOSE AND FIX: System Models Issue
-- ============================================================================
-- Run this script in Supabase SQL Editor to diagnose and fix the issue

-- ============================================================================
-- STEP 1: CHECK IF DATA EXISTS
-- ============================================================================

-- Count rows in the table (bypasses RLS since you're running as admin in SQL Editor)
SELECT 
  'Total models in table' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO DATA - Need to run migration 006_seed_system_models.sql'
    WHEN COUNT(*) > 0 THEN '✅ Data exists'
  END as status
FROM ai_models_system;

-- ============================================================================
-- STEP 2: CHECK YOUR USER ROLE
-- ============================================================================

SELECT 
  u.email,
  p.role,
  p.organization_id,
  CASE 
    WHEN p.role = 'superadmin' THEN '✅ Superadmin - Should have full access'
    WHEN p.role = 'admin' THEN '⚠️ Admin only - Limited access to system models'
    ELSE '❌ Regular user - Cannot manage system models'
  END as access_level
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE u.id = auth.uid();

-- ============================================================================
-- STEP 3: CHECK IF HELPER FUNCTIONS EXIST
-- ============================================================================

SELECT 
  'Helper functions' as check_name,
  COUNT(*) as found,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All helper functions exist'
    ELSE '❌ Missing functions - Need to run migration 007_add_superadmin_role_support.sql'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_superadmin', 'is_admin', 'get_user_role', 'get_user_organization_id');

-- List which functions exist
SELECT 
  routine_name,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_superadmin', 'is_admin', 'get_user_role', 'get_user_organization_id')
ORDER BY routine_name;

-- ============================================================================
-- STEP 4: CHECK RLS POLICIES
-- ============================================================================

SELECT 
  'RLS Policies' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES - RLS may be blocking all access'
    WHEN COUNT(*) >= 3 THEN '✅ Policies exist'
    ELSE '⚠️ Incomplete policies'
  END as status
FROM pg_policies
WHERE tablename = 'ai_models_system';

-- List all policies
SELECT 
  policyname,
  cmd as operations,
  roles
FROM pg_policies
WHERE tablename = 'ai_models_system'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: TEST HELPER FUNCTIONS
-- ============================================================================

DO $$
DECLARE
  v_is_superadmin boolean;
  v_is_admin boolean;
  v_user_role text;
  v_org_id uuid;
BEGIN
  -- Try to call helper functions
  BEGIN
    v_is_superadmin := is_superadmin();
    v_is_admin := is_admin();
    v_user_role := get_user_role();
    v_org_id := get_user_organization_id();
    
    RAISE NOTICE '✅ Helper functions working:';
    RAISE NOTICE '  - is_superadmin(): %', v_is_superadmin;
    RAISE NOTICE '  - is_admin(): %', v_is_admin;
    RAISE NOTICE '  - get_user_role(): %', v_user_role;
    RAISE NOTICE '  - get_user_organization_id(): %', v_org_id;
  EXCEPTION
    WHEN undefined_function THEN
      RAISE NOTICE '❌ Helper functions do not exist!';
      RAISE NOTICE 'Solution: Run migration 007_add_superadmin_role_support.sql';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Error calling helper functions: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- STEP 6: TRY TO SELECT MODELS (TESTS RLS)
-- ============================================================================

DO $$
DECLARE
  v_count integer;
BEGIN
  -- This SELECT will be blocked by RLS if you don't have access
  SELECT COUNT(*) INTO v_count FROM ai_models_system;
  
  RAISE NOTICE '✅ RLS allows access - Found % models', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE '⚠️ Table is empty - Run migration 006_seed_system_models.sql';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '❌ RLS is blocking access';
    RAISE NOTICE 'Your role may not have permission to view system models';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================

-- Show everything in one view
SELECT 
  'Diagnostic Summary' as report,
  (SELECT COUNT(*) FROM ai_models_system) as total_models,
  (SELECT role FROM profiles WHERE id = auth.uid()) as my_role,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_models_system') as rls_policies,
  (SELECT COUNT(*) 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('is_superadmin', 'is_admin', 'get_user_role', 'get_user_organization_id')
  ) as helper_functions;

-- ============================================================================
-- QUICK FIXES
-- ============================================================================

-- OPTION A: If you're NOT a superadmin yet, promote yourself:
-- SELECT * FROM promote_to_superadmin('your-email@example.com');

-- OPTION B: If table is empty, you need to run migration 006
-- Copy and paste the contents of: database/migrations/006_seed_system_models.sql

-- OPTION C: If helper functions don't exist, run migration 007 first
-- Copy and paste the contents of: database/migrations/007_add_superadmin_role_support.sql

-- OPTION D: If RLS policies don't exist, run migration 005
-- Copy and paste the contents of: database/migrations/005_setup_rls_policies.sql

-- ============================================================================
-- TEMPORARY WORKAROUND: View all models (bypasses RLS)
-- ============================================================================

-- This query runs with your SQL Editor privileges, bypassing RLS
-- Use this to verify data exists
SELECT 
  id,
  name,
  role,
  is_active,
  is_featured,
  is_free,
  is_trial,
  required_plan,
  CASE 
    WHEN organization_types = '{}' THEN 'All types'
    ELSE array_to_string(organization_types, ', ')
  END as org_types,
  sort_order
FROM ai_models_system
ORDER BY sort_order;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

/*
SCENARIO 1: Total models = 0
  → Table is empty
  → Solution: Run migration 006_seed_system_models.sql
  
SCENARIO 2: Total models > 0, BUT query fails from frontend
  → RLS is blocking access
  → Check: Are you a superadmin? Run promote_to_superadmin()
  → Check: Do helper functions exist? Run migration 007
  → Check: Do RLS policies exist? Run migration 005
  
SCENARIO 3: Helper functions = 0
  → Migration 007 wasn't run
  → Solution: Run 007_add_superadmin_role_support.sql FIRST
  → Then run 005_setup_rls_policies.sql
  
SCENARIO 4: RLS policies = 0
  → Migration 005 wasn't run OR failed
  → Solution: Run 007 first, then run 005
  
SCENARIO 5: my_role != 'superadmin'
  → You're not promoted yet
  → Solution: Run promote_to_superadmin('your-email@example.com')
*/
