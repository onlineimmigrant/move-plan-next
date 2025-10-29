-- ============================================================================
-- URGENT: Check RLS Policies Blocking Superadmin Access
-- ============================================================================
-- Run this in Supabase SQL Editor to see why models aren't fetched

-- 1. Verify models exist
SELECT 'Models in database:' as check, COUNT(*) as count FROM ai_models_system;

-- 2. Check your current user context (when running from SQL Editor)
SELECT 
  'Your user info:' as check,
  u.email,
  p.role,
  p.organization_id
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE u.id = auth.uid();

-- 3. Check if is_superadmin() function works
SELECT 
  'is_superadmin() result:' as check,
  is_superadmin() as result;

-- 4. List ALL RLS policies on ai_models_system
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'ai_models_system'
ORDER BY policyname;

-- 5. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'ai_models_system';

-- 6. Try to select models (this bypasses RLS when run in SQL Editor)
SELECT 
  id,
  name,
  is_active,
  CASE 
    WHEN organization_types = '{}' THEN 'All types'
    ELSE array_to_string(organization_types, ', ')
  END as org_types
FROM ai_models_system
ORDER BY sort_order;

-- ============================================================================
-- POSSIBLE ISSUES AND FIXES
-- ============================================================================

-- ISSUE 1: RLS policy missing or incorrect
-- Check if "Superadmin full access to system models" policy exists
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_models_system' 
    AND policyname = 'Superadmin full access to system models'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    RAISE NOTICE '❌ PROBLEM: Superadmin policy is MISSING!';
    RAISE NOTICE 'Solution: Run migration 005_setup_rls_policies.sql';
  ELSE
    RAISE NOTICE '✅ Superadmin policy exists';
  END IF;
END $$;

-- ISSUE 2: is_superadmin() function not working
DO $$
BEGIN
  IF is_superadmin() THEN
    RAISE NOTICE '✅ You are recognized as superadmin';
  ELSE
    RAISE NOTICE '❌ PROBLEM: is_superadmin() returns FALSE!';
    RAISE NOTICE 'Your role: %', (SELECT role FROM profiles WHERE id = auth.uid());
    RAISE NOTICE 'Solution: Your role must be "superadmin", not "admin"';
  END IF;
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE '❌ PROBLEM: is_superadmin() function does not exist!';
    RAISE NOTICE 'Solution: Run migration 007_add_superadmin_role_support.sql';
END $$;

-- ============================================================================
-- QUICK FIX: Grant superadmin BYPASS RLS (if policies are the problem)
-- ============================================================================

-- Uncomment and run this if you want to temporarily bypass RLS for testing:
-- ALTER TABLE ai_models_system FORCE ROW LEVEL SECURITY;
-- ALTER ROLE authenticator BYPASSRLS;  -- Dangerous! Only for testing

-- ============================================================================
-- RECOMMENDED FIX: Ensure policy uses correct function
-- ============================================================================

-- The policy should look like this:
/*
CREATE POLICY "Superadmin full access to system models"
ON ai_models_system
FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());
*/

-- If it doesn't exist or is wrong, drop and recreate:
-- DROP POLICY IF EXISTS "Superadmin full access to system models" ON ai_models_system;
-- 
-- CREATE POLICY "Superadmin full access to system models"
-- ON ai_models_system
-- FOR ALL
-- TO authenticated
-- USING (is_superadmin())
-- WITH CHECK (is_superadmin());
