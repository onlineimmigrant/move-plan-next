-- ============================================================================
-- GRADIENT METRICS TABLE FIX
-- ============================================================================
-- Add gradient support to website_metric table (not just the join table)
-- Date: 2025-10-13
-- ============================================================================

-- Add gradient columns to website_metric table
ALTER TABLE website_metric
ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gradient JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_website_metric_is_gradient 
ON website_metric(is_gradient) 
WHERE is_gradient = TRUE;

-- Set default values for existing records
UPDATE website_metric
SET is_gradient = FALSE
WHERE is_gradient IS NULL;

-- Add comment to document the gradient structure
COMMENT ON COLUMN website_metric.gradient IS 
'JSONB structure: {"from": "color", "via": "color", "to": "color"}. 
Example: {"from": "emerald-400", "via": "teal-400", "to": "cyan-500"}';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check metrics with gradients
SELECT 
  id,
  title,
  is_gradient,
  gradient,
  background_color
FROM website_metric
WHERE is_gradient = TRUE;

-- ============================================================================
-- UPDATE PRESET FUNCTION FOR METRICS
-- ============================================================================

-- Update the function to work with website_metric table
CREATE OR REPLACE FUNCTION apply_gradient_preset_to_metric(
  metric_id INTEGER,
  preset_name VARCHAR(100)
)
RETURNS VOID AS $$
DECLARE
  preset_data gradient_presets%ROWTYPE;
BEGIN
  -- Get preset data
  SELECT * INTO preset_data
  FROM gradient_presets
  WHERE name = preset_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gradient preset "%" not found', preset_name;
  END IF;
  
  -- Apply to metric (website_metric table, not join table)
  UPDATE website_metric
  SET 
    is_gradient = TRUE,
    gradient = jsonb_build_object(
      'from', preset_data.gradient_from,
      'via', preset_data.gradient_via,
      'to', preset_data.gradient_to
    )
  WHERE id = metric_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test: Apply gradient to a metric
-- SELECT apply_gradient_preset_to_metric(1, 'Fresh Growth');

-- Test: Custom gradient
-- UPDATE website_metric
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
-- WHERE id = 1;
