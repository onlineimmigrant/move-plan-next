-- Migration: Add RLS policy for updating Stripe keys in organizations table
-- Date: 2025-11-23
-- Description: Allow admins to update Stripe configuration for their organization

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their organization stripe keys" ON organizations;

-- Create policy for updating Stripe keys
-- Only organization admins can update Stripe keys
CREATE POLICY "Admins can update organization stripe keys"
ON organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add comment
COMMENT ON POLICY "Admins can update organization stripe keys" ON organizations IS 
'Allows organization admins to update Stripe API keys for their organization';
