-- ============================================================================
-- Ticket System RLS Diagnostic and Fix
-- ============================================================================
-- This script checks and fixes Row Level Security policies for the ticket system

-- ============================================================================
-- STEP 1: Check current RLS policies
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Checking RLS Policies for Tickets System ===';
  RAISE NOTICE '';
END $$;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('tickets', 'ticket_responses', 'ticket_attachments')
AND schemaname = 'public';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  qual as "USING expression",
  with_check as "WITH CHECK expression"
FROM pg_policies 
WHERE tablename IN ('tickets', 'ticket_responses', 'ticket_attachments')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: Check if tables exist
-- ============================================================================

DO $$
DECLARE
  ticket_count INTEGER;
  response_count INTEGER;
  attachment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ticket_count FROM tickets;
  SELECT COUNT(*) INTO response_count FROM ticket_responses;
  SELECT COUNT(*) INTO attachment_count FROM ticket_attachments;
  
  RAISE NOTICE 'Tickets: %', ticket_count;
  RAISE NOTICE 'Responses: %', response_count;
  RAISE NOTICE 'Attachments: %', attachment_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: Drop existing policies (if any)
-- ============================================================================

-- Tickets table
DROP POLICY IF EXISTS "Customers can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all org tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update all org tickets" ON tickets;

-- Ticket responses table
DROP POLICY IF EXISTS "Customers can view responses on their tickets" ON ticket_responses;
DROP POLICY IF EXISTS "Customers can create responses on their tickets" ON ticket_responses;
DROP POLICY IF EXISTS "Admins can view all org ticket responses" ON ticket_responses;
DROP POLICY IF EXISTS "Admins can create responses on all org tickets" ON ticket_responses;
DROP POLICY IF EXISTS "Admins can update their own responses" ON ticket_responses;

-- Ticket attachments table
DROP POLICY IF EXISTS "Customers can view attachments on their tickets" ON ticket_attachments;
DROP POLICY IF EXISTS "Customers can create attachments on their tickets" ON ticket_attachments;
DROP POLICY IF EXISTS "Admins can view all org ticket attachments" ON ticket_attachments;
DROP POLICY IF EXISTS "Admins can create attachments on all org tickets" ON ticket_attachments;

-- ============================================================================
-- STEP 4: Enable RLS on tables (if not already enabled)
-- ============================================================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create policies for TICKETS table
-- ============================================================================

-- Customers can view their own tickets
CREATE POLICY "Customers can view their own tickets"
ON tickets
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR 
  -- Also allow admins to see tickets
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Customers can create tickets
CREATE POLICY "Customers can create tickets"
ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
);

-- Admins can view all tickets in their organization
CREATE POLICY "Admins can view all org tickets"
ON tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- Admins can update all tickets in their organization
CREATE POLICY "Admins can update all org tickets"
ON tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- ============================================================================
-- STEP 6: Create policies for TICKET_RESPONSES table
-- ============================================================================

-- Customers can view ALL responses on THEIR tickets (including admin responses)
CREATE POLICY "Customers can view responses on their tickets"
ON ticket_responses
FOR SELECT
TO authenticated
USING (
  -- Either this is a response on a ticket owned by the user
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_responses.ticket_id
    AND tickets.customer_id = auth.uid()
  )
  OR
  -- Or the user is an admin in the same org
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_responses.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- Customers can create responses on their own tickets
CREATE POLICY "Customers can create responses on their tickets"
ON ticket_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_responses.ticket_id
    AND tickets.customer_id = auth.uid()
  )
);

-- Admins can view all responses in their organization
CREATE POLICY "Admins can view all org ticket responses"
ON ticket_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_responses.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- Admins can create responses on any ticket in their org
CREATE POLICY "Admins can create responses on all org tickets"
ON ticket_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_responses.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- Admins and customers can update read status on responses
CREATE POLICY "Users can update response read status"
ON ticket_responses
FOR UPDATE
TO authenticated
USING (
  -- Customers can mark responses on their tickets as read
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_responses.ticket_id
    AND tickets.customer_id = auth.uid()
  )
  OR
  -- Admins can mark responses in their org as read
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_responses.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
)
WITH CHECK (
  -- Same conditions for the update
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_responses.ticket_id
    AND tickets.customer_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_responses.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- ============================================================================
-- STEP 7: Create policies for TICKET_ATTACHMENTS table
-- ============================================================================

-- Customers can view attachments on their tickets
CREATE POLICY "Customers can view attachments on their tickets"
ON ticket_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_attachments.ticket_id
    AND tickets.customer_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_attachments.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- Customers can create attachments on their tickets
CREATE POLICY "Customers can create attachments on their tickets"
ON ticket_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_attachments.ticket_id
    AND tickets.customer_id = auth.uid()
  )
);

-- Admins can view all attachments in their organization
CREATE POLICY "Admins can view all org ticket attachments"
ON ticket_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_attachments.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- Admins can create attachments on any ticket in their org
CREATE POLICY "Admins can create attachments on all org tickets"
ON ticket_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    INNER JOIN profiles ON profiles.id = auth.uid()
    WHERE tickets.id = ticket_attachments.ticket_id
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.organization_id = tickets.organization_id
  )
);

-- ============================================================================
-- STEP 8: Verify policies were created
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification: Policies Created ===';
  RAISE NOTICE '';
END $$;

SELECT 
  tablename,
  COUNT(*) as "Number of Policies"
FROM pg_policies 
WHERE tablename IN ('tickets', 'ticket_responses', 'ticket_attachments')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- STEP 9: Test queries (optional - run manually with your user)
-- ============================================================================

-- Test: Can customer see their tickets?
-- SELECT * FROM tickets WHERE customer_id = auth.uid();

-- Test: Can customer see responses on their tickets (including admin responses)?
-- SELECT tr.*, t.customer_id 
-- FROM ticket_responses tr
-- INNER JOIN tickets t ON t.id = tr.ticket_id
-- WHERE t.customer_id = auth.uid();

-- Test: Can admin see all tickets in their org?
-- SELECT t.* FROM tickets t
-- INNER JOIN profiles p ON p.organization_id = t.organization_id
-- WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin');

RAISE NOTICE '✅ RLS policies created successfully!';
RAISE NOTICE '⚠️  Make sure to test with both customer and admin accounts';
RAISE NOTICE '⚠️  Check that realtime is enabled for ticket_responses table in Supabase dashboard';
