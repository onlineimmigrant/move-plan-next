-- Quick Database Check for System Models Setup
-- Run this in Supabase SQL Editor to diagnose issues

-- ============================================================================
-- 1. CHECK IF TABLES EXIST
-- ============================================================================

SELECT 
  'ai_models_system' as table_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_models_system'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'org_system_model_config',
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'org_system_model_config'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'ai_model_usage',
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_model_usage'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- ============================================================================
-- 2. CHECK IF HELPER FUNCTIONS EXIST
-- ============================================================================

SELECT 
  routine_name as function_name,
  '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_superadmin', 'is_admin', 'get_user_role', 'get_user_organization_id')
ORDER BY routine_name;

-- If you see less than 4 functions, migration 007 wasn't run!

-- ============================================================================
-- 3. CHECK YOUR CURRENT USER ROLE
-- ============================================================================

SELECT 
  u.email,
  p.role,
  p.organization_id,
  CASE 
    WHEN p.role = 'superadmin' THEN '✅ You have superadmin access'
    WHEN p.role = 'admin' THEN '⚠️ You are admin but NOT superadmin'
    ELSE '❌ You are a regular user'
  END as access_level
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE u.id = auth.uid();

-- ============================================================================
-- 4. COUNT SYSTEM MODELS (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_models_system'
  ) THEN
    RAISE NOTICE 'System Models Count: %', (SELECT COUNT(*) FROM ai_models_system);
  ELSE
    RAISE NOTICE '❌ Table ai_models_system does not exist';
  END IF;
END $$;

-- ============================================================================
-- 5. CHECK RLS POLICIES (if table exists)
-- ============================================================================

SELECT 
  policyname as policy_name,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'ai_models_system'
ORDER BY policyname;

-- Should see 3 policies:
-- 1. Superadmin full access to system models (ALL operations)
-- 2. Admin read filtered system models (SELECT only)
-- 3. User read enabled system models (SELECT only)

-- ============================================================================
-- 6. LIST SYSTEM MODELS (if you have access)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_models_system'
  ) THEN
    -- Try to select models
    PERFORM id FROM ai_models_system LIMIT 1;
    RAISE NOTICE '✅ Can access system models';
  ELSE
    RAISE NOTICE '❌ Table does not exist';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '❌ RLS is blocking access - you may not have the right role';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- Try to actually select (will fail if RLS blocks you)
-- SELECT id, name, role, is_active, is_featured
-- FROM ai_models_system
-- ORDER BY sort_order;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

-- ✅ ALL GREEN (Perfect state):
-- - All 3 tables exist
-- - All 4 helper functions exist
-- - Your role is 'superadmin'
-- - 3 RLS policies are present
-- - 6 system models exist
-- - You can select models
-- → You're ready to use the superadmin portal!

-- ⚠️ MIXED RESULTS:
-- - Tables exist but functions don't: Run migration 007
-- - Functions exist but tables don't: Run migrations 001-004
-- - Everything exists but you're not superadmin: Promote yourself
-- - Everything exists but can't select: Check RLS policies

-- ❌ ALL RED (Need to start over):
-- - No tables: Run migrations 001-007 in correct order
-- - See: RUN_SYSTEM_MODELS_MIGRATIONS.md

-- ============================================================================
-- QUICK FIX COMMANDS
-- ============================================================================

-- If you need to promote yourself to superadmin:
-- SELECT * FROM promote_to_superadmin('your-email@example.com');

-- If you need to see all models (bypasses RLS - only works in SQL editor):
-- SELECT * FROM ai_models_system;

-- If you need to check which migrations were run:
-- SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;
-- (Only if you're using Prisma)
