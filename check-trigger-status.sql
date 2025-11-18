-- Check if pg_net extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Check if the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'sync_r2_cors_on_org_update';

-- Check if the trigger exists
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_sync_r2_cors';

-- Check recent pg_net requests (if any)
SELECT * FROM net._http_response 
ORDER BY created DESC 
LIMIT 5;
