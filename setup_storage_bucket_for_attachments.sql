-- Supabase Storage Bucket Setup for Ticket Attachments
-- NOTE: Storage policies MUST be created through the Supabase Dashboard UI
-- SQL INSERT into storage.policies is not supported

-- =============================================================================
-- STEP-BY-STEP GUIDE TO CREATE STORAGE BUCKET AND POLICIES
-- =============================================================================

-- STEP 1: CREATE THE STORAGE BUCKET
-- ===================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create New Bucket" (or "New bucket" button)
-- 3. Enter details:
--    - Name: ticket-attachments
--    - Public bucket: OFF (unchecked) - IMPORTANT for security
--    - File size limit: 10485760 (10MB in bytes)
--    - Allowed MIME types: 
--      image/*
--      application/pdf
--      application/msword
--      application/vnd.openxmlformats-officedocument.*
--      application/vnd.ms-excel
--      application/vnd.openxmlformats-officedocument.spreadsheetml.*
--      text/plain
--      text/csv
-- 4. Click "Create bucket"


-- STEP 2: CREATE STORAGE POLICIES IN SUPABASE DASHBOARD
-- =======================================================
-- Go to Storage > ticket-attachments bucket > Policies tab
-- Click "New Policy" for each policy below:

-- POLICY 1: Users can upload to their ticket folders
-- ---------------------------------------------------
-- Policy Name: Users can upload to their ticket folders
-- Allowed Operations: INSERT
-- Target Roles: authenticated
-- Policy Definition (USING expression):
bucket_id = 'ticket-attachments' 
AND (storage.foldername(name))[1] = auth.uid()::text

-- WITH CHECK expression (same as USING):
bucket_id = 'ticket-attachments' 
AND (storage.foldername(name))[1] = auth.uid()::text


-- POLICY 2: Admins can upload to any folder
-- ------------------------------------------
-- Policy Name: Admins can upload to any folder
-- Allowed Operations: INSERT
-- Target Roles: authenticated
-- Policy Definition (USING expression):
bucket_id = 'ticket-attachments' 
AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
)

-- WITH CHECK expression (same as USING)


-- POLICY 3: Users can view their ticket files
-- --------------------------------------------
-- Policy Name: Users can view their ticket files
-- Allowed Operations: SELECT
-- Target Roles: authenticated
-- Policy Definition (USING expression):
bucket_id = 'ticket-attachments' 
AND (storage.foldername(name))[1] = auth.uid()::text


-- POLICY 4: Admins can view all files
-- ------------------------------------
-- Policy Name: Admins can view all files
-- Allowed Operations: SELECT
-- Target Roles: authenticated
-- Policy Definition (USING expression):
bucket_id = 'ticket-attachments' 
AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
)


-- POLICY 5: Users can delete their own files
-- -------------------------------------------
-- Policy Name: Users can delete their own files
-- Allowed Operations: DELETE
-- Target Roles: authenticated
-- Policy Definition (USING expression):
bucket_id = 'ticket-attachments' 
AND (storage.foldername(name))[1] = auth.uid()::text


-- POLICY 6: Admins can delete any file
-- -------------------------------------
-- Policy Name: Admins can delete any file
-- Allowed Operations: DELETE
-- Target Roles: authenticated
-- Policy Definition (USING expression):
bucket_id = 'ticket-attachments' 
AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
)


-- STEP 3: VERIFY SETUP
-- =====================
-- After creating all policies, verify:
-- 1. Bucket name is exactly: ticket-attachments
-- 2. Bucket is PRIVATE (public = false)
-- 3. All 6 policies are created and enabled
-- 4. File size limit is set to 10MB (10485760 bytes)
-- 5. MIME types are configured


-- ALTERNATIVE: SIMPLIFIED APPROACH FOR TESTING
-- =============================================
-- If you want to quickly test without complex policies, you can create a simpler policy:
-- 
-- Policy Name: Authenticated users can do anything
-- Allowed Operations: SELECT, INSERT, UPDATE, DELETE
-- Target Roles: authenticated
-- USING expression: bucket_id = 'ticket-attachments'
--
-- WARNING: This is less secure but easier for testing.
-- Replace with the detailed policies above for production.


-- TROUBLESHOOTING
-- ===============
-- If uploads fail, check:
-- 1. User is authenticated (auth.uid() returns a value)
-- 2. Bucket policies are enabled
-- 3. File path follows pattern: {user_id}/{ticket_id}/{filename}
-- 4. File size is under 10MB
-- 5. File MIME type is in allowed list
-- 6. Check browser console for specific error messages
