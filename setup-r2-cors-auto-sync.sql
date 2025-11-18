-- Automatic R2 CORS Sync System
-- 
-- RECOMMENDED: Use Supabase Database Webhooks instead of this SQL trigger
-- See: setup-supabase-database-webhook.md for instructions
--
-- This SQL approach is kept as a backup option, but Supabase Database Webhooks
-- are more reliable and easier to debug.

-- Alternative SQL Trigger (if you can't use Database Webhooks)
-- Requires pg_net extension which may have limitations in some Supabase projects

-- Step 1: Create a function that calls the sync API when organizations change
CREATE OR REPLACE FUNCTION sync_r2_cors_on_org_update()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only proceed if domains or base_url changed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       NEW.domains IS DISTINCT FROM OLD.domains OR
       NEW.base_url IS DISTINCT FROM OLD.base_url
     )) THEN
    
    -- Call the CORS sync via HTTP request to our API
    -- Uses pg_net extension for async HTTP requests
    SELECT net.http_post(
      url := 'https://codedharmony.app/api/sync-r2-cors',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4='
      ),
      body := jsonb_build_object(
        'event', CASE 
          WHEN TG_OP = 'INSERT' THEN 'organization.created'
          ELSE 'organization.domains.updated'
        END,
        'organization_id', NEW.id,
        'domains', NEW.domains
      )
    ) INTO request_id;
    
    -- Log the request ID for debugging
    RAISE NOTICE 'R2 CORS sync triggered, request_id: %', request_id;
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'R2 CORS sync failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on organizations table
DROP TRIGGER IF EXISTS trigger_sync_r2_cors ON organizations;

CREATE TRIGGER trigger_sync_r2_cors
  AFTER INSERT OR UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_r2_cors_on_org_update();

COMMENT ON TRIGGER trigger_sync_r2_cors ON organizations IS 
  'Automatically syncs R2 CORS when organization domains change';

-- Note: Update the URL in the function above to match your deployment:
-- - Production: https://codedharmony.app/api/sync-r2-cors
-- - Staging: https://your-staging-url.vercel.app/api/sync-r2-cors
