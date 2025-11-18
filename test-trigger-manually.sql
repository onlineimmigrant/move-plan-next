-- Test the trigger manually by updating an organization

-- First, check current domains
SELECT id, name, base_url, domains 
FROM organizations 
LIMIT 5;

-- Test 1: Add a test domain to trigger the sync
-- Replace 'your-org-id' with an actual organization ID from above
-- UPDATE organizations 
-- SET domains = array_append(COALESCE(domains, ARRAY[]::text[]), 'test-domain.com')
-- WHERE id = 'your-org-id';

-- Test 2: Or just touch the domains field to trigger
-- UPDATE organizations 
-- SET domains = domains 
-- WHERE id = 'your-org-id';

-- Check the pg_net request queue
SELECT id, created, request_id, error_msg, status_code
FROM net._http_response 
ORDER BY created DESC 
LIMIT 10;
