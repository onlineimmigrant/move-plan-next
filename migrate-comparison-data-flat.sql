-- Migration: Comparison Data from Nested to Flat Structure
-- 
-- Purpose: Transform competitor data from nested features (inside plans)
--          to flat features array with plan_id references
--
-- Before: { plans: [{ features: [...] }] }
-- After:  { plans: [...], features: [{ our_plan_id: ... }] }
--
-- Benefits:
-- - Enables partial updates by plan (reduced token usage)
-- - Simpler lookup patterns (single array find)
-- - Better support for AI agent incremental updates

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS comparison_competitor_backup AS
SELECT * FROM comparison_competitor
WHERE data IS NOT NULL;

-- Step 2: Migrate data structure
UPDATE comparison_competitor
SET data = (
  SELECT jsonb_build_object(
    -- Keep plans array but remove nested features
    'plans', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'our_plan_id', plan->>'our_plan_id',
          'our_plan_name', plan->>'our_plan_name',
          'monthly', plan->>'monthly',
          'yearly', plan->>'yearly',
          'note', plan->>'note'
        )
      )
      FROM jsonb_array_elements(data->'plans') AS plan
      WHERE plan ? 'our_plan_id'  -- Ensure plan has ID
    ),
    -- Create flat features array with plan references
    'features', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'our_feature_id', feature->>'our_feature_id',
          'our_feature_name', feature->>'our_feature_name',
          'our_plan_id', plan->>'our_plan_id',
          'our_plan_name', plan->>'our_plan_name',
          'status', feature->>'status',
          'amount', feature->>'amount',
          'unit', feature->>'unit',
          'note', feature->>'note'
        )
      ), '[]'::jsonb)
      FROM jsonb_array_elements(data->'plans') AS plan,
           jsonb_array_elements(plan->'features') AS feature
      WHERE plan ? 'our_plan_id'
        AND feature ? 'our_feature_id'
    )
  )
)
WHERE data IS NOT NULL
  AND data ? 'plans'
  -- Only migrate if has old nested structure
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(data->'plans') AS plan
    WHERE plan ? 'features'
  );

-- Step 3: Verify migration results
DO $$
DECLARE
  total_competitors INTEGER;
  migrated_competitors INTEGER;
  total_features_before INTEGER;
  total_features_after INTEGER;
BEGIN
  -- Count competitors
  SELECT COUNT(*) INTO total_competitors
  FROM comparison_competitor
  WHERE data IS NOT NULL;
  
  -- Count migrated competitors (with flat features array)
  SELECT COUNT(*) INTO migrated_competitors
  FROM comparison_competitor
  WHERE data IS NOT NULL
    AND data ? 'features'
    AND jsonb_typeof(data->'features') = 'array';
  
  -- Count total features before (in backup)
  SELECT COALESCE(SUM(
    (SELECT COUNT(*)
     FROM jsonb_array_elements(c.data->'plans') AS plan,
          jsonb_array_elements(plan->'features') AS feature)
  ), 0) INTO total_features_before
  FROM comparison_competitor_backup c
  WHERE c.data IS NOT NULL;
  
  -- Count total features after (in flat array)
  SELECT COALESCE(SUM(jsonb_array_length(data->'features')), 0) INTO total_features_after
  FROM comparison_competitor
  WHERE data IS NOT NULL
    AND data ? 'features';
  
  -- Log results
  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Total competitors: %', total_competitors;
  RAISE NOTICE 'Migrated competitors: %', migrated_competitors;
  RAISE NOTICE 'Features before: %', total_features_before;
  RAISE NOTICE 'Features after: %', total_features_after;
  
  IF total_features_before = total_features_after THEN
    RAISE NOTICE 'SUCCESS: Feature count matches!';
  ELSE
    RAISE WARNING 'WARNING: Feature count mismatch! Before: %, After: %', 
      total_features_before, total_features_after;
  END IF;
END $$;

-- Step 4: Sample migrated data
SELECT 
  id,
  name,
  jsonb_pretty(data) as migrated_data
FROM comparison_competitor
WHERE data IS NOT NULL
LIMIT 1;

-- Step 5: Validation queries
-- Check for orphaned features (features with invalid plan_id)
SELECT 
  c.name as competitor_name,
  f->>'our_plan_id' as plan_id,
  f->>'our_feature_name' as feature_name
FROM comparison_competitor c,
     jsonb_array_elements(c.data->'features') AS f
WHERE c.data IS NOT NULL
  AND c.data ? 'features'
  AND NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(c.data->'plans') AS p
    WHERE p->>'our_plan_id' = f->>'our_plan_id'
  );

-- Check for plans without features
SELECT 
  c.name as competitor_name,
  p->>'our_plan_name' as plan_name,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(c.data->'features') AS f
    WHERE f->>'our_plan_id' = p->>'our_plan_id'
  ) as feature_count
FROM comparison_competitor c,
     jsonb_array_elements(c.data->'plans') AS p
WHERE c.data IS NOT NULL;

-- Step 6: Cleanup (uncomment when verified)
-- DROP TABLE IF EXISTS comparison_competitor_backup;

-- To rollback if needed:
-- UPDATE comparison_competitor c
-- SET data = b.data
-- FROM comparison_competitor_backup b
-- WHERE c.id = b.id;
