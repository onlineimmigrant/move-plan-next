-- ============================================================================
-- EMERGENCY FIX: Recreate Superadmin RLS Policy
-- ============================================================================
-- Run this if models exist but frontend can't fetch them

-- Step 1: Check current state
DO $$
DECLARE
  model_count INTEGER;
  has_policy BOOLEAN;
  user_role TEXT;
BEGIN
  -- Check models exist
  SELECT COUNT(*) INTO model_count FROM ai_models_system;
  RAISE NOTICE 'Models in database: %', model_count;
  
  -- Check policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_models_system' 
    AND policyname = 'Superadmin full access to system models'
  ) INTO has_policy;
  RAISE NOTICE 'Superadmin policy exists: %', has_policy;
  
  -- Check your role
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RAISE NOTICE 'Your role: %', user_role;
  
  -- Check if is_superadmin() works
  BEGIN
    IF is_superadmin() THEN
      RAISE NOTICE '✅ is_superadmin() returns TRUE';
    ELSE
      RAISE NOTICE '❌ is_superadmin() returns FALSE - You need superadmin role!';
    END IF;
  EXCEPTION
    WHEN undefined_function THEN
      RAISE NOTICE '❌ is_superadmin() function does not exist!';
  END;
END $$;

-- ============================================================================
-- Step 2: Drop existing policies (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Superadmin full access to system models" ON ai_models_system;
DROP POLICY IF EXISTS "Admin read filtered system models" ON ai_models_system;
DROP POLICY IF EXISTS "User read enabled system models" ON ai_models_system;

-- ============================================================================
-- Step 3: Recreate Superadmin policy with correct permissions
-- ============================================================================

CREATE POLICY "Superadmin full access to system models"
ON ai_models_system
FOR ALL
TO authenticated
USING (
  -- Check if user has superadmin role
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
);

-- ============================================================================
-- Step 4: Recreate Admin policy (read-only, filtered)
-- ============================================================================

CREATE POLICY "Admin read filtered system models"
ON ai_models_system
FOR SELECT
TO authenticated
USING (
  -- Admin users (not superadmin)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  AND is_active = true
  AND (
    -- Check org type match
    organization_types = '{}'
    OR EXISTS (
      SELECT 1 FROM organizations 
      INNER JOIN profiles ON profiles.organization_id = organizations.id
      WHERE profiles.id = auth.uid()
      AND organizations.type = ANY(ai_models_system.organization_types)
    )
  )
);

-- ============================================================================
-- Step 5: Recreate User policy (read-only, enabled models)
-- ============================================================================

CREATE POLICY "User read enabled system models"
ON ai_models_system
FOR SELECT
TO authenticated
USING (
  -- Regular users
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'user'
  )
  AND is_active = true
  AND (
    -- Check org type match
    organization_types = '{}'
    OR EXISTS (
      SELECT 1 FROM organizations 
      INNER JOIN profiles ON profiles.organization_id = organizations.id
      WHERE profiles.id = auth.uid()
      AND organizations.type = ANY(ai_models_system.organization_types)
    )
  )
  AND (
    -- Check if admin enabled this model
    EXISTS (
      SELECT 1 FROM org_system_model_config
      INNER JOIN profiles ON profiles.organization_id = org_system_model_config.organization_id
      WHERE org_system_model_config.system_model_id = ai_models_system.id
      AND profiles.id = auth.uid()
      AND org_system_model_config.is_enabled_for_users = true
    )
  )
);

-- ============================================================================
-- Step 6: Verify policies were created
-- ============================================================================

SELECT 
  policyname,
  cmd as operations
FROM pg_policies
WHERE tablename = 'ai_models_system'
ORDER BY policyname;

-- ============================================================================
-- Step 7: Test if you can now see models
-- ============================================================================

DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO visible_count FROM ai_models_system;
  
  IF visible_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS! You can now see % models', visible_count;
  ELSE
    RAISE NOTICE '❌ STILL BLOCKED! Check your role and permissions';
    RAISE NOTICE 'Your role: %', (SELECT role FROM profiles WHERE id = auth.uid());
  END IF;
END $$;

-- List the models you can see
SELECT 
  id,
  name,
  is_active,
  is_featured,
  required_plan
FROM ai_models_system
ORDER BY sort_order;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script:
-- 1. Drops all existing RLS policies on ai_models_system
-- 2. Recreates them with explicit role checks (not using helper functions)
-- 3. Uses direct EXISTS queries instead of is_superadmin() to avoid function dependency
-- 4. Tests if policies work after creation

-- If this fixes the issue, the problem was with the policy definition or helper functions

-- After running this, refresh your frontend and check console logs
