-- RLS Policy for Customer Booking Access
-- Allows customers to view bookings where their email matches customer_email

-- First, ensure RLS is enabled on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow customers to SELECT their own bookings by email
CREATE POLICY "Customers can view their own bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  customer_email = auth.jwt() ->> 'email'
);

-- Policy: Allow admins to view all bookings in their organization
CREATE POLICY "Admins can view all organization bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = bookings.organization_id
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Policy: Allow customers to UPDATE their own bookings (for viewed_by field)
CREATE POLICY "Customers can update viewed_by on their bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (
  customer_email = auth.jwt() ->> 'email'
)
WITH CHECK (
  customer_email = auth.jwt() ->> 'email'
);

-- Policy: Allow admins to UPDATE all organization bookings
CREATE POLICY "Admins can update organization bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = bookings.organization_id
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = bookings.organization_id
    AND profiles.role IN ('admin', 'superadmin')
  )
);
