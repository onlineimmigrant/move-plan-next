-- Migration: Fix ticket assignment RLS policy
-- Problem: UPDATE policy has USING clause but no WITH CHECK clause
-- This can cause silent failures when updating assigned_to field

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Admins can update tickets" 
  ON tickets 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add comment to document the fix
COMMENT ON POLICY "Admins can update tickets" ON tickets IS 
  'Admins can update tickets in their organization. Both USING and WITH CHECK ensure the admin has proper permissions before and after the update.';
