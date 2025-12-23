-- Fix/Create validation function for flat features structure
-- This ensures the database accepts the new data structure

-- Drop existing constraint if it exists
ALTER TABLE comparison_competitor 
DROP CONSTRAINT IF EXISTS valid_comparison_data;

-- Drop and recreate the validation function
DROP FUNCTION IF EXISTS validate_comparison_data(jsonb);

CREATE OR REPLACE FUNCTION validate_comparison_data(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow NULL data
  IF data IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check that data has plans array
  IF NOT (data ? 'plans' AND jsonb_typeof(data->'plans') = 'array') THEN
    RETURN FALSE;
  END IF;
  
  -- Check that data has features array
  IF NOT (data ? 'features' AND jsonb_typeof(data->'features') = 'array') THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each feature has required fields
  -- Features should have: our_feature_id, our_plan_id, status
  DECLARE
    feature JSONB;
  BEGIN
    FOR feature IN SELECT * FROM jsonb_array_elements(data->'features')
    LOOP
      -- Check required fields exist
      IF NOT (feature ? 'our_feature_id' AND feature ? 'our_plan_id' AND feature ? 'status') THEN
        RAISE NOTICE 'Feature missing required fields: %', feature;
        RETURN FALSE;
      END IF;
      
      -- Validate status is one of the allowed values
      IF NOT (feature->>'status' IN ('available', 'unavailable', 'partial', 'amount', 'unknown')) THEN
        RAISE NOTICE 'Invalid status value: %', feature->>'status';
        RETURN FALSE;
      END IF;
    END LOOP;
  END;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Validation error: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the constraint back
ALTER TABLE comparison_competitor 
ADD CONSTRAINT valid_comparison_data 
CHECK (validate_comparison_data(data));

-- Update any existing competitors with NULL or invalid data to have empty structure
UPDATE comparison_competitor
SET data = '{"plans": [], "features": []}'::jsonb
WHERE data IS NULL OR NOT validate_comparison_data(data);

-- Verify the constraint works
DO $$
BEGIN
  -- Test valid data
  IF NOT validate_comparison_data('{"plans": [], "features": []}'::jsonb) THEN
    RAISE EXCEPTION 'Empty structure should be valid';
  END IF;
  
  -- Test valid data with features
  IF NOT validate_comparison_data('{"plans": [{"our_plan_id": "test"}], "features": [{"our_feature_id": "f1", "our_plan_id": "p1", "status": "available"}]}'::jsonb) THEN
    RAISE EXCEPTION 'Valid feature structure should be valid';
  END IF;
  
  RAISE NOTICE 'Validation function is working correctly';
END $$;

-- Show current data structure for verification
SELECT 
  id,
  name,
  jsonb_pretty(data) as current_data
FROM comparison_competitor
WHERE is_active = true
LIMIT 3;
