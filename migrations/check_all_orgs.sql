-- Check all organizations and their base_urls
SELECT id, name, base_url, created_at
FROM organizations
ORDER BY created_at DESC;
