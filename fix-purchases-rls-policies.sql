-- Fix RLS Policies for Purchases Table
-- Allows customers to view their own purchases
-- Allows admins to view all purchases in their organization

-- First, drop any existing policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Customers can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all organization purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view organization purchases" ON purchases;

-- Ensure RLS is enabled
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Allow customers to view their own purchases
CREATE POLICY "Customers can view their own purchases"
ON purchases
FOR SELECT
TO authenticated
USING (
  profiles_id::text = auth.uid()::text
);

-- Policy: Allow admins to view all purchases in their organization
CREATE POLICY "Admins can view all organization purchases"
ON purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id::text = purchases.organization_id::text
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Optional: Policy for admins to manage (INSERT/UPDATE/DELETE) purchases
CREATE POLICY "Admins can manage organization purchases"
ON purchases
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id::text = purchases.organization_id::text
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id::text = purchases.organization_id::text
    AND profiles.role IN ('admin', 'superadmin')
  )
);
