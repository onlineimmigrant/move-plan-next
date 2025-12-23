-- Migration Script: Nest Features Under Pricing Plans
-- This script migrates comparison_competitor data from the old structure:
--   { "plans": [...], "features": [...] }
-- to the new nested structure:
--   { "plans": [{ ..., "features": [...] }] }

-- BACKUP FIRST!
-- CREATE TABLE comparison_competitor_backup AS SELECT * FROM comparison_competitor;

-- Update each competitor's data to nest features under plans
UPDATE comparison_competitor
SET data = (
  SELECT jsonb_build_object(
    'plans', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'our_plan_id', plan->>'our_plan_id',
          'monthly', plan->'monthly',
          'yearly', plan->'yearly',
          'note', plan->'note',
          'features', (
            -- Get all features and nest them under this plan
            SELECT COALESCE(jsonb_agg(feature), '[]'::jsonb)
            FROM jsonb_array_elements(data->'features') AS feature
          )
        )
      )
      FROM jsonb_array_elements(data->'plans') AS plan
    )
  )
  FROM comparison_competitor AS cc
  WHERE cc.id = comparison_competitor.id
)
WHERE data IS NOT NULL
  AND data ? 'features'  -- Only migrate if old structure exists
  AND jsonb_typeof(data->'features') = 'array';

-- Verify the migration
SELECT 
  id,
  name,
  jsonb_pretty(data) as migrated_data
FROM comparison_competitor
WHERE data IS NOT NULL
LIMIT 5;

-- Check for any competitors that still have the old structure
SELECT 
  COUNT(*) as unmigrated_count
FROM comparison_competitor
WHERE data ? 'features'
  AND jsonb_typeof(data->'features') = 'array';

-- This should return 0 if migration was successful
