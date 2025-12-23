-- Add scoring configuration to comparison_config JSONB in website_templatesection
-- This allows admin to enable/disable scoring and configure weights

-- The scoring configuration will be stored in the comparison_config JSONB column
-- Structure:
-- {
--   ...existing config,
--   "scoring": {
--     "enabled": false,
--     "weights": {
--       "featureCoverage": 40,
--       "priceCompetitiveness": 30,
--       "valueRatio": 20,
--       "transparency": 10
--     },
--     "show_breakdown": false
--   }
-- }

-- Note: Since this is JSONB, updates are done programmatically via the admin UI
-- or can be done manually like this:

-- ============================================================
-- OPTION 1: Enable scoring for ALL comparison sections
-- ============================================================
UPDATE website_templatesection 
SET comparison_config = jsonb_set(
  COALESCE(comparison_config, '{}'::jsonb),
  '{scoring}',
  '{
    "enabled": true,
    "weights": {
      "featureCoverage": 40,
      "priceCompetitiveness": 30,
      "valueRatio": 20,
      "transparency": 10
    },
    "show_breakdown": true
  }'::jsonb
)
WHERE section_type = 'comparison';

-- ============================================================
-- OPTION 2: Enable scoring for a specific section by ID
-- ============================================================
-- UPDATE website_templatesection 
-- SET comparison_config = jsonb_set(
--   COALESCE(comparison_config, '{}'::jsonb),
--   '{scoring}',
--   '{
--     "enabled": true,
--     "weights": {
--       "featureCoverage": 40,
--       "priceCompetitiveness": 30,
--       "valueRatio": 20,
--       "transparency": 10
--     },
--     "show_breakdown": false
--   }'::jsonb
-- )
-- WHERE section_type = 'comparison' AND id = 'your-section-id';

-- ============================================================
-- OPTION 3: Disable scoring for all sections
-- ============================================================
-- UPDATE website_templatesection 
-- SET comparison_config = jsonb_set(
--   COALESCE(comparison_config, '{}'::jsonb),
--   '{scoring,enabled}',
--   'false'::jsonb
-- )
-- WHERE section_type = 'comparison';

-- ============================================================
-- HELPFUL QUERIES
-- ============================================================

-- View current scoring configuration for all comparison sections
-- SELECT 
--   id,
--   section_title,
--   comparison_config -> 'scoring' ->> 'enabled' as scoring_enabled,
--   comparison_config -> 'scoring' -> 'weights' as scoring_weights,
--   comparison_config -> 'scoring' ->> 'show_breakdown' as show_breakdown
-- FROM website_templatesection 
-- WHERE section_type = 'comparison';

-- Add helpful comment
COMMENT ON COLUMN website_templatesection.comparison_config IS 'Configuration for comparison sections including competitor_ids, pricing options, feature filters, scoring settings, etc. Scoring structure: {enabled: boolean, weights: {featureCoverage, priceCompetitiveness, valueRatio, transparency}, show_breakdown: boolean}';
