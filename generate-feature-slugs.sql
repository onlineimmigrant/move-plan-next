-- Generate slugs for features that don't have them
-- This script creates slugs from the 'name' field by:
-- 1. Converting to lowercase
-- 2. Replacing spaces with hyphens
-- 3. Removing special characters
-- 4. Removing consecutive hyphens

-- Update features with empty or null slugs
UPDATE feature
SET slug = (
  -- Convert name to lowercase and replace spaces with hyphens
  regexp_replace(
    -- Remove any characters that aren't alphanumeric, hyphens, or underscores
    regexp_replace(
      -- Replace consecutive spaces with a single hyphen
      regexp_replace(
        lower(trim(name)),
        '\s+', '-', 'g'
      ),
      '[^a-z0-9\-_]', '', 'g'
    ),
    -- Replace consecutive hyphens with a single hyphen
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '' OR trim(slug) = '';

-- Show updated features
SELECT 
  id, 
  name, 
  slug,
  organization_id
FROM feature
WHERE organization_id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3'
ORDER BY name;

-- Check for duplicate slugs (if any exist, you may need to handle them manually)
SELECT 
  slug, 
  COUNT(*) as count,
  string_agg(name, ', ') as feature_names
FROM feature
WHERE organization_id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3'
  AND slug IS NOT NULL 
  AND slug != ''
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY count DESC;
