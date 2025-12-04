-- Update organization base_url_local for localhost development
UPDATE organizations 
SET base_url_local = 'http://localhost:3000'
WHERE id = 'de0d5c21-787f-49c2-a665-7ff8e599c891';

-- Verify the update
SELECT id, name, base_url, base_url_local 
FROM organizations 
WHERE id = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
