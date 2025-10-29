-- ============================================================================
-- ADD RLS POLICIES FOR org_system_model_config
-- ============================================================================
-- Run this to enable admins to manage system model configs for their org

-- Step 1: Enable RLS on the table
ALTER TABLE org_system_model_config ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Superadmin full access to model configs" ON org_system_model_config;
DROP POLICY IF EXISTS "Admin manage org model configs" ON org_system_model_config;
DROP POLICY IF EXISTS "User read org model configs" ON org_system_model_config;

-- ============================================================================
-- Policy 1: Superadmin can see/modify all configs
-- ============================================================================

CREATE POLICY "Superadmin full access to model configs"
ON org_system_model_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
);

-- ============================================================================
-- Policy 2: Admin can manage configs for their organization
-- ============================================================================

CREATE POLICY "Admin manage org model configs"
ON org_system_model_config
FOR ALL
TO authenticated
USING (
  -- Check if user is admin and config belongs to their org
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
    AND profiles.organization_id = org_system_model_config.organization_id
  )
)
WITH CHECK (
  -- Check if user is admin and trying to create/update config for their org
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
    AND profiles.organization_id = org_system_model_config.organization_id
  )
);

-- ============================================================================
-- Policy 3: Users can read configs for their organization (to see enabled models)
-- ============================================================================

CREATE POLICY "User read org model configs"
ON org_system_model_config
FOR SELECT
TO authenticated
USING (
  -- Check if config belongs to user's organization
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = org_system_model_config.organization_id
  )
);

-- ============================================================================
-- Verify policies were created
-- ============================================================================

SELECT 
  policyname,
  cmd as operations
FROM pg_policies
WHERE tablename = 'org_system_model_config'
ORDER BY policyname;

-- ============================================================================
-- Test that admins can insert configs
-- ============================================================================

-- This query should return your organization_id
SELECT 
  'Your org:' as label,
  profiles.organization_id,
  profiles.role
FROM profiles
WHERE profiles.id = auth.uid();

-- Test if you can see the table (should work now)
SELECT COUNT(*) as config_count FROM org_system_model_config;

