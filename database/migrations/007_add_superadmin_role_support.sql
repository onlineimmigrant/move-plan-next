-- Migration: Add Superadmin Role Support
-- Description: Extends the two-tier (admin/user) role system to three-tier (superadmin/admin/user)
-- Date: 2025-10-29
-- Phase: 1.6 - Authentication Enhancement
-- Dependencies: Existing profiles table with 'role' column

-- ============================================================================
-- STEP 1: UPDATE ROLE COLUMN TO SUPPORT SUPERADMIN
-- ============================================================================

-- Note: The profiles table already has a 'role' TEXT column
-- We just need to document the new value and add constraints

-- Add a check constraint to ensure only valid roles are used
-- First, drop any existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

-- Add new constraint with three valid roles
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('superadmin', 'admin', 'user'));

COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 
  'Ensures role is one of: superadmin (system-wide access), admin (organization admin), user (regular user)';

-- ============================================================================
-- STEP 2: CREATE HELPER FUNCTIONS FOR ROLE CHECKS
-- ============================================================================

-- First, drop ALL existing versions of these functions to avoid conflicts
-- Explicitly specifying parameter signatures to avoid ambiguity
DROP FUNCTION IF EXISTS is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS is_superadmin(UUID) CASCADE;

DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;  -- Drop the existing parameterized version first
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin(TEXT) CASCADE;

DROP FUNCTION IF EXISTS is_admin_or_superadmin() CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_superadmin(UUID) CASCADE;

DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;

DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_organization_id(UUID) CASCADE;

-- Function to check if current user is superadmin
CREATE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_superadmin IS 'Returns true if the current authenticated user has superadmin role';

-- Function to check if current user is admin (of their org)
CREATE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin IS 'Returns true if the current authenticated user has admin role';

-- Function to check if current user is admin or superadmin
CREATE FUNCTION is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin_or_superadmin IS 'Returns true if user is either admin or superadmin';

-- Function to get current user's role
CREATE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user'); -- Default to 'user' if not found
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role IS 'Returns the role of the current authenticated user';

-- Function to get current user's organization_id
CREATE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_organization_id IS 'Returns the organization_id of the current authenticated user';

-- ============================================================================
-- STEP 3: CREATE FUNCTION TO SAFELY PROMOTE USER TO SUPERADMIN
-- ============================================================================

-- Drop existing version if it exists
DROP FUNCTION IF EXISTS promote_to_superadmin(TEXT);

-- This function should ONLY be called manually by database administrators
-- It's not exposed via API for security reasons
CREATE FUNCTION promote_to_superadmin(user_email TEXT)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  old_role TEXT,
  new_role TEXT,
  promoted_at TIMESTAMPTZ
) AS $$
DECLARE
  target_user_id UUID;
  target_old_role TEXT;
BEGIN
  -- Find user by email
  SELECT p.id, p.role INTO target_user_id, target_old_role
  FROM profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE u.email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update role to superadmin
  UPDATE profiles
  SET role = 'superadmin',
      updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Return result
  RETURN QUERY
  SELECT 
    target_user_id,
    user_email,
    target_old_role,
    'superadmin'::TEXT,
    NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION promote_to_superadmin IS 
  'Promotes a user to superadmin role. SECURITY: Should only be called by database administrators via direct SQL access.';

-- ============================================================================
-- STEP 4: CREATE AUDIT LOG FOR ROLE CHANGES
-- ============================================================================

-- Table to track role changes for security audit
CREATE TABLE IF NOT EXISTS role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_role TEXT NOT NULL,
  new_role TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_role_audit_user ON role_change_audit(user_id, changed_at DESC);
CREATE INDEX idx_role_audit_changed_by ON role_change_audit(changed_by);
CREATE INDEX idx_role_audit_new_role ON role_change_audit(new_role) WHERE new_role = 'superadmin';

COMMENT ON TABLE role_change_audit IS 'Audit log for all role changes, especially promotions to superadmin';

-- Enable RLS on audit table
ALTER TABLE role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Superadmin view role audit"
  ON role_change_audit
  FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- ============================================================================
-- STEP 5: CREATE TRIGGER TO LOG ROLE CHANGES
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_log_role_change ON profiles;
DROP FUNCTION IF EXISTS log_role_change();

-- Trigger function to automatically log role changes
CREATE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO role_change_audit (
      user_id,
      changed_by,
      old_role,
      new_role,
      changed_at
    ) VALUES (
      NEW.id,
      auth.uid(), -- Current user making the change
      OLD.role,
      NEW.role,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

COMMENT ON FUNCTION log_role_change IS 'Automatically logs role changes to role_change_audit table';

-- ============================================================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================================================

-- Query to check constraint was added
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'profiles'::regclass AND conname = 'profiles_role_check';

-- Query to verify helper functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('is_superadmin', 'is_admin', 'get_user_role', 'get_user_organization_id');

-- Query to check all current roles
-- SELECT role, COUNT(*) as user_count
-- FROM profiles
-- GROUP BY role
-- ORDER BY role;

-- ============================================================================
-- STEP 7: EXAMPLE USAGE - PROMOTE YOUR FIRST SUPERADMIN
-- ============================================================================

-- IMPORTANT: Replace with your actual email address
-- Run this MANUALLY after migration to create your first superadmin

-- Example:
-- SELECT * FROM promote_to_superadmin('your-email@example.com');

-- Verify the promotion:
-- SELECT id, email, role, updated_at 
-- FROM profiles p
-- INNER JOIN auth.users u ON u.id = p.id
-- WHERE u.email = 'your-email@example.com';

-- View the audit log:
-- SELECT * FROM role_change_audit ORDER BY changed_at DESC LIMIT 10;

-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================

/*
1. FIRST SUPERADMIN CREATION:
   - After running this migration, you MUST manually promote at least one user to superadmin
   - Use: SELECT * FROM promote_to_superadmin('your-email@example.com');
   - This should be done via direct database access, not via API

2. SUBSEQUENT SUPERADMIN PROMOTIONS:
   - Should be done through your admin interface by existing superadmins
   - The promote_to_superadmin() function can be called via API with proper authentication
   - Or continue using direct database access for maximum security

3. ROLE HIERARCHY:
   - superadmin: Full system access, can manage all organizations, all system models
   - admin: Organization admin, can manage their org's users, enable/disable system models
   - user: Regular user, can only use enabled models

4. BACKWARD COMPATIBILITY:
   - All existing users with role='admin' or role='user' will continue to work
   - No data migration needed
   - Only new constraint and helper functions added

5. RLS POLICIES:
   - Migration 005 (005_setup_rls_policies.sql) already references 'superadmin' role
   - Once this migration runs, those policies will work correctly
   - Helper functions (is_superadmin, is_admin) can be used in future RLS policies

6. AUDIT TRAIL:
   - All role changes are automatically logged to role_change_audit table
   - Special attention to superadmin promotions for security monitoring
   - Only superadmins can view audit logs

7. APPLICATION LAYER:
   - Update your middleware/auth checks to recognize 'superadmin' role
   - Add UI for superadmin portal (Phase 2-8 of implementation plan)
   - Implement API endpoints for role management with proper authorization
*/
