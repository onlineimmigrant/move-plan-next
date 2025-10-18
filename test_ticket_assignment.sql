-- Quick Test: Ticket Assignment
-- Run this to test if assignment is working
-- Replace the UUIDs with your actual values

-- ============================================
-- SETUP: Define your test values here
-- ============================================

DO $$
DECLARE
  test_ticket_id UUID := 'YOUR_TICKET_ID_HERE';  -- Replace with actual ticket ID
  test_admin_id UUID := 'YOUR_ADMIN_ID_HERE';    -- Replace with admin user ID to assign
  current_admin_id UUID := 'YOUR_CURRENT_ADMIN_ID'; -- Replace with your logged-in admin ID
BEGIN

-- ============================================
-- TEST 1: Check Prerequisites
-- ============================================
RAISE NOTICE '============================================';
RAISE NOTICE 'TEST 1: Checking Prerequisites';
RAISE NOTICE '============================================';

-- Check if ticket exists
IF EXISTS (SELECT 1 FROM tickets WHERE id = test_ticket_id) THEN
  RAISE NOTICE '✓ Ticket exists: %', test_ticket_id;
ELSE
  RAISE NOTICE '✗ Ticket NOT found: %', test_ticket_id;
  RETURN;
END IF;

-- Check if admin to assign exists
IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_admin_id) THEN
  RAISE NOTICE '✓ Admin user exists: %', test_admin_id;
ELSE
  RAISE NOTICE '✗ Admin user NOT found: %', test_admin_id;
  RETURN;
END IF;

-- Check current admin role
IF EXISTS (SELECT 1 FROM profiles WHERE id = current_admin_id AND role = 'admin') THEN
  RAISE NOTICE '✓ Current user is admin: %', current_admin_id;
ELSE
  RAISE NOTICE '✗ Current user is NOT admin or not found: %', current_admin_id;
  RETURN;
END IF;

-- ============================================
-- TEST 2: Check Organizations Match
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE 'TEST 2: Checking Organization Match';
RAISE NOTICE '============================================';

DECLARE
  ticket_org UUID;
  admin_org UUID;
BEGIN
  SELECT organization_id INTO ticket_org FROM tickets WHERE id = test_ticket_id;
  SELECT organization_id INTO admin_org FROM profiles WHERE id = current_admin_id;
  
  RAISE NOTICE 'Ticket organization: %', ticket_org;
  RAISE NOTICE 'Admin organization: %', admin_org;
  
  IF ticket_org = admin_org THEN
    RAISE NOTICE '✓ Organizations MATCH - assignment should work';
  ELSE
    RAISE NOTICE '✗ Organizations DO NOT MATCH - assignment will FAIL';
    RAISE NOTICE 'Fix: UPDATE tickets SET organization_id = ''%'' WHERE id = ''%'';', 
      admin_org, test_ticket_id;
    RETURN;
  END IF;
END;

-- ============================================
-- TEST 3: Check RLS Policies
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE 'TEST 3: Checking RLS Policies';
RAISE NOTICE '============================================';

DECLARE
  has_with_check BOOLEAN;
BEGIN
  -- Check if UPDATE policy has WITH CHECK
  SELECT COUNT(*) > 0 INTO has_with_check
  FROM pg_policies
  WHERE tablename = 'tickets'
    AND policyname = 'Admins can update tickets'
    AND with_check IS NOT NULL;
  
  IF has_with_check THEN
    RAISE NOTICE '✓ UPDATE policy has WITH CHECK clause';
  ELSE
    RAISE NOTICE '✗ UPDATE policy MISSING WITH CHECK clause';
    RAISE NOTICE 'Fix: Run fix_ticket_assignment_rls.sql';
  END IF;
END;

-- ============================================
-- TEST 4: Simulate the Assignment Update
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE 'TEST 4: Simulating Assignment Update';
RAISE NOTICE '============================================';

DECLARE
  old_assigned_to UUID;
  rows_updated INTEGER;
BEGIN
  -- Store old value
  SELECT assigned_to INTO old_assigned_to FROM tickets WHERE id = test_ticket_id;
  RAISE NOTICE 'Current assigned_to: %', COALESCE(old_assigned_to::text, 'NULL');
  
  -- Try the update
  UPDATE tickets 
  SET assigned_to = test_admin_id
  WHERE id = test_ticket_id
    AND organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = current_admin_id
      AND role = 'admin'
    );
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated > 0 THEN
    RAISE NOTICE '✓ Update successful! Rows affected: %', rows_updated;
    
    -- Verify the change
    DECLARE
      new_assigned_to UUID;
    BEGIN
      SELECT assigned_to INTO new_assigned_to FROM tickets WHERE id = test_ticket_id;
      RAISE NOTICE 'New assigned_to: %', new_assigned_to;
      
      IF new_assigned_to = test_admin_id THEN
        RAISE NOTICE '✓✓✓ SUCCESS! Ticket assigned correctly!';
      ELSE
        RAISE NOTICE '✗✗✗ FAILURE! Assignment value mismatch';
      END IF;
    END;
  ELSE
    RAISE NOTICE '✗✗✗ FAILURE! No rows updated - RLS policy blocked the update';
  END IF;
  
  -- Rollback so this is just a test
  RAISE NOTICE '';
  RAISE NOTICE 'Rolling back changes (this was just a test)...';
  UPDATE tickets SET assigned_to = old_assigned_to WHERE id = test_ticket_id;
END;

-- ============================================
-- SUMMARY
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE 'TEST COMPLETE';
RAISE NOTICE '============================================';
RAISE NOTICE 'If all tests passed, assignment should work in the UI.';
RAISE NOTICE 'If tests failed, check the error messages above for fixes.';

END $$;
