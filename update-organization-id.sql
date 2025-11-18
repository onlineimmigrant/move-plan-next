-- Update user's organization_id to match the R2 storage folder
-- Replace YOUR_USER_EMAIL with your actual email address

-- First, check current organization_id for your user
SELECT id, email, organization_id 
FROM profiles 
WHERE email = 'YOUR_USER_EMAIL';

-- Update to the correct organization_id that has the files in R2
UPDATE profiles 
SET organization_id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3'
WHERE email = 'YOUR_USER_EMAIL';

-- Verify the update
SELECT id, email, organization_id 
FROM profiles 
WHERE email = 'YOUR_USER_EMAIL';
