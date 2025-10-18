-- Debug script for ticket assignment issues
-- Run these queries to diagnose why assigned_to might not be updating

-- ============================================
-- 1. CHECK CURRENT TICKET STATE
-- ============================================
-- Replace 'YOUR_TICKET_ID' with the actual ticket ID

SELECT 
  id,
  subject,
  assigned_to,
  priority,
  status,
  organization_id,
  created_at
FROM tickets 
WHERE id = 'YOUR_TICKET_ID';

-- ============================================
-- 2. CHECK IF USER IS ADMIN
-- ============================================
-- Replace 'YOUR_USER_ID' with your admin user ID

SELECT 
  id,
  email,
  role,
  organization_id
FROM profiles
WHERE id = 'YOUR_USER_ID';

-- ============================================
-- 3. CHECK IF ADMIN CAN ACCESS TICKET
-- ============================================
-- This simulates the RLS USING clause

SELECT 
  t.id,
  t.subject,
  t.organization_id,
  p.id as admin_id,
  p.role,
  p.organization_id as admin_org_id
FROM tickets t
CROSS JOIN profiles p
WHERE t.id = 'YOUR_TICKET_ID'
  AND p.id = 'YOUR_USER_ID'
  AND t.organization_id = p.organization_id
  AND p.role = 'admin';

-- If this returns a row, the admin should be able to update the ticket

-- ============================================
-- 4. TRY MANUAL UPDATE
-- ============================================
-- Replace values and run as the admin user

-- First, set your Supabase connection to use the admin user's auth token
-- Then run:

UPDATE tickets 
SET assigned_to = 'ADMIN_USER_ID_TO_ASSIGN'
WHERE id = 'YOUR_TICKET_ID'
  AND organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = 'YOUR_USER_ID'
    AND role = 'admin'
  )
RETURNING id, assigned_to, organization_id;

-- If this returns a row with the updated assigned_to, the RLS policy works
-- If it returns nothing, the RLS policy is blocking the update

-- ============================================
-- 5. CHECK FOR CONFLICTING POLICIES
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tickets'
ORDER BY policyname;

-- ============================================
-- 6. CHECK FOREIGN KEY CONSTRAINT
-- ============================================
-- Verify the assigned_to references a valid user

SELECT 
  t.id as ticket_id,
  t.assigned_to,
  u.id as user_exists
FROM tickets t
LEFT JOIN auth.users u ON u.id = t.assigned_to
WHERE t.id = 'YOUR_TICKET_ID';

-- If user_exists is NULL but assigned_to has a value, 
-- the user doesn't exist and the FK constraint might be blocking

-- ============================================
-- 7. CHECK COLUMN PERMISSIONS
-- ============================================

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets'
  AND column_name IN ('assigned_to', 'priority', 'status')
ORDER BY ordinal_position;

-- ============================================
-- 8. TEST ASSIGNMENT WITH LOGGING
-- ============================================
-- This shows what's actually happening

DO $$
DECLARE
  ticket_org_id UUID;
  admin_org_id UUID;
  update_result INTEGER;
BEGIN
  -- Get ticket's org
  SELECT organization_id INTO ticket_org_id
  FROM tickets 
  WHERE id = 'YOUR_TICKET_ID';
  
  RAISE NOTICE 'Ticket organization: %', ticket_org_id;
  
  -- Get admin's org
  SELECT organization_id INTO admin_org_id
  FROM profiles 
  WHERE id = 'YOUR_USER_ID';
  
  RAISE NOTICE 'Admin organization: %', admin_org_id;
  
  -- Check if they match
  IF ticket_org_id = admin_org_id THEN
    RAISE NOTICE 'Organizations match - update should work';
  ELSE
    RAISE NOTICE 'Organizations DO NOT match - update will fail!';
  END IF;
  
  -- Try the update
  UPDATE tickets 
  SET assigned_to = 'ADMIN_USER_ID_TO_ASSIGN'
  WHERE id = 'YOUR_TICKET_ID';
  
  GET DIAGNOSTICS update_result = ROW_COUNT;
  RAISE NOTICE 'Rows updated: %', update_result;
  
  -- Verify the update
  SELECT assigned_to INTO admin_org_id
  FROM tickets
  WHERE id = 'YOUR_TICKET_ID';
  
  RAISE NOTICE 'New assigned_to value: %', admin_org_id;
END $$;

-- ============================================
-- 9. COMMON ISSUES AND FIXES
-- ============================================

/*
ISSUE 1: Organizations don't match
- Ticket belongs to org A
- Admin belongs to org B
- Solution: Assign ticket to correct organization first

ISSUE 2: User is not an admin
- Profile.role is not 'admin'
- Solution: Update profile role

ISSUE 3: RLS policy missing WITH CHECK
- UPDATE policy has USING but no WITH CHECK
- Solution: Run fix_ticket_assignment_rls.sql

ISSUE 4: Foreign key violation
- Trying to assign to a user_id that doesn't exist in auth.users
- Solution: Verify user exists before assigning

ISSUE 5: Silent failure in Supabase client
- Update returns success but nothing changes
- Solution: Add .select() to see what actually updated
*/
