-- Function to sync Supabase redirect URLs when organization domains change
-- This will call the Next.js API endpoint to update Supabase configuration

CREATE OR REPLACE FUNCTION sync_supabase_redirects_on_org_update()
RETURNS TRIGGER AS $$
DECLARE
  response_status INTEGER;
BEGIN
  -- Only trigger sync if base_url, base_url_local, or domains changed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.base_url IS DISTINCT FROM NEW.base_url OR
       OLD.base_url_local IS DISTINCT FROM NEW.base_url_local OR
       OLD.domains IS DISTINCT FROM NEW.domains
     )) THEN
    
    -- Call the Next.js API to sync redirect URLs
    -- Note: This requires pg_net extension or supabase_functions.http_request
    PERFORM supabase_functions.http_request(
      url := 'https://codedharmony.app/api/sync-supabase-redirects',
      method := 'POST',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', current_setting('app.settings.sync_api_secret', true)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
    
    RAISE NOTICE 'Triggered Supabase redirect URLs sync for organization: %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS trigger_sync_supabase_redirects ON organizations;

CREATE TRIGGER trigger_sync_supabase_redirects
  AFTER INSERT OR UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_supabase_redirects_on_org_update();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_supabase_redirects_on_org_update() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_supabase_redirects_on_org_update() TO service_role;

COMMENT ON FUNCTION sync_supabase_redirects_on_org_update() IS 
  'Automatically syncs Supabase Auth redirect URLs when organization domains are created or updated';

COMMENT ON TRIGGER trigger_sync_supabase_redirects ON organizations IS 
  'Triggers Supabase redirect URL sync when organization domains change';
