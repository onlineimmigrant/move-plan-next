-- ============================================================================
-- GRADIENT BACKGROUND IMPLEMENTATION - DATABASE MIGRATION
-- ============================================================================
-- Description: Add gradient background support to Header, Footer, 
--              Template Sections, Template Heading Sections, and Metrics
-- Date: 2025-10-13
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- PART 1: HEADER GRADIENT SUPPORT (settings.header_style JSONB)
-- ============================================================================
-- NOTE: No schema changes needed - JSONB is flexible
-- This section documents the new structure and updates existing data

-- Document the new header_style structure:
-- {
--   "type": "default|minimal|centered|sidebar|mega|transparent|scrolled",
--   "color": "gray-700",
--   "color_hover": "gray-900",
--   "background": "white",
--   "menu_width": "7xl",
--   "menu_items_are_text": true,
--   "is_gradient": false,              // NEW FIELD
--   "gradient": {                      // NEW FIELD
--     "from": "sky-500",
--     "via": "white",
--     "to": "purple-600"
--   }
-- }

-- Add default gradient fields to existing header_style records
UPDATE settings
SET header_style = jsonb_set(
  COALESCE(header_style, '{}'::jsonb),
  '{is_gradient}',
  'false'
)
WHERE header_style IS NOT NULL 
  AND header_style->>'is_gradient' IS NULL;

-- Add empty gradient object to existing records
UPDATE settings
SET header_style = jsonb_set(
  header_style,
  '{gradient}',
  '{"from": "", "via": "", "to": ""}'::jsonb
)
WHERE header_style IS NOT NULL 
  AND header_style->>'gradient' IS NULL;

-- SAMPLE: Update a specific settings record with a gradient header
-- Ocean Blue Gradient (Professional)
UPDATE settings
SET header_style = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        header_style,
        '{is_gradient}',
        'true'
      ),
      '{gradient,from}',
      '"sky-500"'
    ),
    '{gradient,via}',
    '"white"'
  ),
  '{gradient,to}',
  '"blue-600"'
)
WHERE id = 1; -- Replace with your settings ID

-- SAMPLE: Professional Gradient Presets for Headers
-- Uncomment and adjust settings IDs as needed

-- Sunset Gradient
-- UPDATE settings
-- SET header_style = header_style || 
--   '{"is_gradient": true, "gradient": {"from": "orange-400", "via": "pink-500", "to": "purple-600"}}'::jsonb
-- WHERE id = 2;

-- Neutral Light Gradient (Subtle)
-- UPDATE settings
-- SET header_style = header_style || 
--   '{"is_gradient": true, "gradient": {"from": "gray-50", "via": "white", "to": "gray-100"}}'::jsonb
-- WHERE id = 3;

-- Emerald Professional
-- UPDATE settings
-- SET header_style = header_style || 
--   '{"is_gradient": true, "gradient": {"from": "emerald-500", "via": "teal-400", "to": "cyan-500"}}'::jsonb
-- WHERE id = 4;


-- ============================================================================
-- PART 2: FOOTER GRADIENT SUPPORT (settings.footer_style JSONB)
-- ============================================================================
-- NOTE: No schema changes needed - JSONB is flexible

-- Document the new footer_style structure:
-- {
--   "type": "default|light|compact|stacked|minimal|grid",
--   "color": "gray-300",
--   "color_hover": "white",
--   "background": "neutral-900",
--   "is_gradient": false,              // NEW FIELD
--   "gradient": {                      // NEW FIELD
--     "from": "neutral-900",
--     "via": "gray-800",
--     "to": "black"
--   }
-- }

-- Add default gradient fields to existing footer_style records
UPDATE settings
SET footer_style = jsonb_set(
  COALESCE(footer_style, '{}'::jsonb),
  '{is_gradient}',
  'false'
)
WHERE footer_style IS NOT NULL 
  AND footer_style->>'is_gradient' IS NULL;

-- Add empty gradient object to existing records
UPDATE settings
SET footer_style = jsonb_set(
  footer_style,
  '{gradient}',
  '{"from": "", "via": "", "to": ""}'::jsonb
)
WHERE footer_style IS NOT NULL 
  AND footer_style->>'gradient' IS NULL;

-- SAMPLE: Update a specific settings record with a gradient footer
-- Dark Professional Gradient
UPDATE settings
SET footer_style = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        footer_style,
        '{is_gradient}',
        'true'
      ),
      '{gradient,from}',
      '"neutral-900"'
    ),
    '{gradient,via}',
    '"gray-800"'
  ),
  '{gradient,to}',
  '"black"'
)
WHERE id = 1; -- Replace with your settings ID

-- SAMPLE: Professional Gradient Presets for Footers

-- Dark Blue Professional
-- UPDATE settings
-- SET footer_style = footer_style || 
--   '{"is_gradient": true, "gradient": {"from": "slate-900", "via": "gray-900", "to": "neutral-950"}}'::jsonb
-- WHERE id = 2;

-- Navy to Midnight
-- UPDATE settings
-- SET footer_style = footer_style || 
--   '{"is_gradient": true, "gradient": {"from": "blue-950", "via": "indigo-950", "to": "black"}}'::jsonb
-- WHERE id = 3;

-- Subtle Dark (Two-color)
-- UPDATE settings
-- SET footer_style = footer_style || 
--   '{"is_gradient": true, "gradient": {"from": "gray-900", "to": "gray-950"}}'::jsonb
-- WHERE id = 4;


-- ============================================================================
-- PART 3: TEMPLATE SECTIONS GRADIENT SUPPORT
-- ============================================================================

-- Add gradient columns to website_templatesection table
ALTER TABLE website_templatesection
ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gradient JSONB DEFAULT NULL;

-- Add index for better query performance on gradient field
CREATE INDEX IF NOT EXISTS idx_website_templatesection_is_gradient 
ON website_templatesection(is_gradient) 
WHERE is_gradient = TRUE;

-- Set default values for existing records
UPDATE website_templatesection
SET is_gradient = FALSE
WHERE is_gradient IS NULL;

-- Add comment to document the gradient structure
COMMENT ON COLUMN website_templatesection.gradient IS 
'JSONB structure: {"from": "color", "via": "color", "to": "color"}. 
Example: {"from": "sky-500", "via": "white", "to": "purple-600"}';

-- SAMPLE: Update specific template sections with gradients
-- Ocean gradient for hero-style sections
-- UPDATE website_templatesection
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "sky-400", "via": "blue-300", "to": "indigo-500"}'::jsonb
-- WHERE id = 1; -- Replace with your section ID

-- Subtle background gradient for content sections
-- UPDATE website_templatesection
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "gray-50", "via": "white", "to": "gray-50"}'::jsonb
-- WHERE id = 2; -- Replace with your section ID

-- SAMPLE: Gradient Presets for Template Sections

-- Warm Gradient (CTA sections)
-- UPDATE website_templatesection
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "orange-400", "via": "red-400", "to": "pink-500"}'::jsonb
-- WHERE id = 3;

-- Cool Professional (Feature sections)
-- UPDATE website_templatesection
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "cyan-400", "via": "sky-300", "to": "blue-500"}'::jsonb
-- WHERE id = 4;

-- Elegant Purple (Testimonial sections)
-- UPDATE website_templatesection
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "purple-400", "via": "fuchsia-400", "to": "pink-500"}'::jsonb
-- WHERE id = 5;

-- Nature Green (Eco/sustainability sections)
-- UPDATE website_templatesection
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
-- WHERE id = 6;


-- ============================================================================
-- PART 4: TEMPLATE HEADING SECTIONS GRADIENT SUPPORT
-- ============================================================================

-- Add gradient columns to website_templatesectionheading table
ALTER TABLE website_templatesectionheading
ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gradient JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_website_templatesectionheading_is_gradient 
ON website_templatesectionheading(is_gradient) 
WHERE is_gradient = TRUE;

-- Set default values for existing records
UPDATE website_templatesectionheading
SET is_gradient = FALSE
WHERE is_gradient IS NULL;

-- Add comment to document the gradient structure
COMMENT ON COLUMN website_templatesectionheading.gradient IS 
'JSONB structure: {"from": "color", "via": "color", "to": "color"}. 
Example: {"from": "indigo-500", "via": "purple-500", "to": "pink-500"}';

-- SAMPLE: Update specific template heading sections with gradients
-- Hero heading with bold gradient
-- UPDATE website_templatesectionheading
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "blue-600", "via": "indigo-500", "to": "purple-600"}'::jsonb
-- WHERE id = 1; -- Replace with your heading ID

-- Subtle professional heading gradient
-- UPDATE website_templatesectionheading
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "gray-100", "via": "white", "to": "gray-100"}'::jsonb
-- WHERE id = 2; -- Replace with your heading ID

-- SAMPLE: Gradient Presets for Template Headings

-- Vibrant Landing Page Header
-- UPDATE website_templatesectionheading
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "sky-500", "via": "blue-500", "to": "indigo-600"}'::jsonb
-- WHERE id = 3;

-- Apple-style Minimalist
-- UPDATE website_templatesectionheading
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "gray-50", "via": "white", "to": "gray-50"}'::jsonb
-- WHERE id = 4;

-- CodedHarmony Bold Statement
-- UPDATE website_templatesectionheading
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "indigo-600", "via": "purple-600", "to": "pink-600"}'::jsonb
-- WHERE id = 5;


-- ============================================================================
-- PART 5: METRICS GRADIENT SUPPORT
-- ============================================================================

-- Add gradient columns to website_templatesection_metrics table
ALTER TABLE website_templatesection_metrics
ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gradient JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_website_templatesection_metrics_is_gradient 
ON website_templatesection_metrics(is_gradient) 
WHERE is_gradient = TRUE;

-- Set default values for existing records
UPDATE website_templatesection_metrics
SET is_gradient = FALSE
WHERE is_gradient IS NULL;

-- Add comment to document the gradient structure
COMMENT ON COLUMN website_templatesection_metrics.gradient IS 
'JSONB structure: {"from": "color", "via": "color", "to": "color"}. 
Example: {"from": "emerald-400", "via": "teal-400", "to": "cyan-500"}';

-- SAMPLE: Update specific metrics with gradients
-- Success/growth metric with green gradient
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
-- WHERE id = 1; -- Replace with your metric ID

-- Trust/reliability metric with blue gradient
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "sky-400", "via": "blue-400", "to": "indigo-500"}'::jsonb
-- WHERE id = 2; -- Replace with your metric ID

-- SAMPLE: Gradient Presets for Metrics

-- Achievement Gold
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "yellow-400", "via": "orange-400", "to": "red-400"}'::jsonb
-- WHERE id = 3;

-- Innovation Purple
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "purple-400", "via": "fuchsia-400", "to": "pink-400"}'::jsonb
-- WHERE id = 4;

-- Reliability Blue
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "blue-400", "via": "cyan-400", "to": "teal-400"}'::jsonb
-- WHERE id = 5;

-- Speed/Performance Red
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "red-400", "via": "orange-400", "to": "yellow-400"}'::jsonb
-- WHERE id = 6;

-- Subtle Neutral (Professional)
-- UPDATE website_templatesection_metrics
-- SET 
--   is_gradient = TRUE,
--   gradient = '{"from": "gray-100", "via": "white", "to": "gray-100"}'::jsonb
-- WHERE id = 7;


-- ============================================================================
-- PART 6: PROFESSIONAL GRADIENT PRESETS LIBRARY
-- ============================================================================

-- Create a reference table for gradient presets (optional)
CREATE TABLE IF NOT EXISTS gradient_presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  gradient_from VARCHAR(50) NOT NULL,
  gradient_via VARCHAR(50),
  gradient_to VARCHAR(50) NOT NULL,
  use_case VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert professional gradient presets
INSERT INTO gradient_presets (name, description, gradient_from, gradient_via, gradient_to, use_case) VALUES
  -- Blue Family
  ('Ocean Blue', 'Professional ocean-inspired gradient', 'sky-500', 'blue-400', 'indigo-600', 'Headers, Hero sections'),
  ('Sky Light', 'Light, airy blue gradient', 'sky-100', 'blue-50', 'indigo-100', 'Backgrounds'),
  ('Deep Ocean', 'Dark professional blue', 'blue-900', 'indigo-900', 'purple-950', 'Footers, Dark sections'),
  
  -- Green Family
  ('Fresh Growth', 'Vibrant growth-oriented gradient', 'emerald-400', 'green-400', 'teal-500', 'Success metrics, Growth stats'),
  ('Nature Calm', 'Calming natural gradient', 'green-300', 'emerald-300', 'teal-400', 'Eco sections'),
  ('Forest Deep', 'Deep forest gradient', 'green-800', 'emerald-900', 'teal-950', 'Dark nature themes'),
  
  -- Purple/Pink Family
  ('Royal Purple', 'Bold, innovative gradient', 'purple-500', 'fuchsia-500', 'pink-600', 'Innovation, Premium features'),
  ('Lavender Dream', 'Soft, elegant gradient', 'purple-200', 'fuchsia-200', 'pink-300', 'Elegant backgrounds'),
  ('Midnight Purple', 'Deep luxury gradient', 'purple-900', 'fuchsia-950', 'pink-950', 'Premium footers'),
  
  -- Orange/Red Family
  ('Sunset Warm', 'Warm, inviting gradient', 'orange-400', 'red-400', 'pink-500', 'CTAs, Warm sections'),
  ('Fire Energy', 'High-energy gradient', 'red-500', 'orange-500', 'yellow-500', 'Action-oriented sections'),
  ('Autumn Calm', 'Soft warm gradient', 'orange-200', 'red-200', 'pink-300', 'Warm backgrounds'),
  
  -- Neutral Family
  ('Gray Professional', 'Subtle professional gradient', 'gray-100', 'white', 'gray-100', 'Professional sections'),
  ('Slate Modern', 'Modern slate gradient', 'slate-200', 'gray-100', 'zinc-200', 'Modern designs'),
  ('Dark Professional', 'Professional dark gradient', 'gray-900', 'slate-900', 'neutral-950', 'Dark footers'),
  
  -- Multi-color Family
  ('Rainbow Spectrum', 'Full spectrum gradient', 'red-400', 'yellow-400', 'blue-400', 'Creative, Playful sections'),
  ('Cyber Tech', 'Tech-inspired gradient', 'cyan-400', 'blue-500', 'purple-600', 'Tech sections'),
  ('Sunset Beach', 'Beach sunset gradient', 'yellow-400', 'orange-500', 'pink-600', 'Travel, Lifestyle');

-- Add comments
COMMENT ON TABLE gradient_presets IS 'Library of professional gradient presets for quick application';


-- ============================================================================
-- PART 7: UTILITY FUNCTIONS
-- ============================================================================

-- Function to apply a preset gradient to a template section
CREATE OR REPLACE FUNCTION apply_gradient_preset_to_section(
  section_id INTEGER,
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
  
  -- Apply to template section
  UPDATE website_templatesection
  SET 
    is_gradient = TRUE,
    gradient = jsonb_build_object(
      'from', preset_data.gradient_from,
      'via', preset_data.gradient_via,
      'to', preset_data.gradient_to
    )
  WHERE id = section_id;
END;
$$ LANGUAGE plpgsql;

-- Function to apply a preset gradient to a metric
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
  
  -- Apply to metric
  UPDATE website_templatesection_metrics
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

-- Function to apply a preset gradient to header
CREATE OR REPLACE FUNCTION apply_gradient_preset_to_header(
  settings_id INTEGER,
  preset_name VARCHAR(100)
)
RETURNS VOID AS $$
DECLARE
  preset_data gradient_presets%ROWTYPE;
BEGIN
  SELECT * INTO preset_data
  FROM gradient_presets
  WHERE name = preset_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gradient preset "%" not found', preset_name;
  END IF;
  
  UPDATE settings
  SET header_style = header_style || 
    jsonb_build_object(
      'is_gradient', true,
      'gradient', jsonb_build_object(
        'from', preset_data.gradient_from,
        'via', preset_data.gradient_via,
        'to', preset_data.gradient_to
      )
    )
  WHERE id = settings_id;
END;
$$ LANGUAGE plpgsql;

-- Function to apply a preset gradient to footer
CREATE OR REPLACE FUNCTION apply_gradient_preset_to_footer(
  settings_id INTEGER,
  preset_name VARCHAR(100)
)
RETURNS VOID AS $$
DECLARE
  preset_data gradient_presets%ROWTYPE;
BEGIN
  SELECT * INTO preset_data
  FROM gradient_presets
  WHERE name = preset_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gradient preset "%" not found', preset_name;
  END IF;
  
  UPDATE settings
  SET footer_style = footer_style || 
    jsonb_build_object(
      'is_gradient', true,
      'gradient', jsonb_build_object(
        'from', preset_data.gradient_from,
        'via', preset_data.gradient_via,
        'to', preset_data.gradient_to
      )
    )
  WHERE id = settings_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 8: USAGE EXAMPLES
-- ============================================================================

-- Example 1: Apply "Ocean Blue" gradient to header
-- SELECT apply_gradient_preset_to_header(1, 'Ocean Blue');

-- Example 2: Apply "Dark Professional" gradient to footer
-- SELECT apply_gradient_preset_to_footer(1, 'Dark Professional');

-- Example 3: Apply "Fresh Growth" gradient to a metric
-- SELECT apply_gradient_preset_to_metric(5, 'Fresh Growth');

-- Example 4: Apply "Royal Purple" gradient to a section
-- SELECT apply_gradient_preset_to_section(3, 'Royal Purple');

-- Example 5: Bulk apply gradients to all metrics
-- UPDATE website_templatesection_metrics
-- SET is_gradient = TRUE,
--     gradient = (SELECT jsonb_build_object(
--       'from', gradient_from,
--       'via', gradient_via,
--       'to', gradient_to
--     ) FROM gradient_presets WHERE name = 'Fresh Growth')
-- WHERE id IN (1, 2, 3); -- Replace with your metric IDs


-- ============================================================================
-- PART 9: VERIFICATION QUERIES
-- ============================================================================

-- Check header gradient configurations
SELECT 
  id,
  organization_id,
  header_style->>'type' as header_type,
  header_style->>'is_gradient' as is_gradient,
  header_style->'gradient' as gradient_config
FROM settings
WHERE header_style IS NOT NULL;

-- Check footer gradient configurations
SELECT 
  id,
  organization_id,
  footer_style->>'type' as footer_type,
  footer_style->>'is_gradient' as is_gradient,
  footer_style->'gradient' as gradient_config
FROM settings
WHERE footer_style IS NOT NULL;

-- Check template sections with gradients
SELECT 
  id,
  is_gradient,
  gradient
FROM website_templatesection
WHERE is_gradient = TRUE;

-- Check template headings with gradients
SELECT 
  id,
  is_gradient,
  gradient
FROM website_templatesectionheading
WHERE is_gradient = TRUE;

-- Check metrics with gradients
SELECT 
  id,
  is_gradient,
  gradient
FROM website_templatesection_metrics
WHERE is_gradient = TRUE;

-- Summary statistics
SELECT 
  'Headers with gradients' as category,
  COUNT(*) as count
FROM settings
WHERE header_style->>'is_gradient' = 'true'
UNION ALL
SELECT 
  'Footers with gradients',
  COUNT(*)
FROM settings
WHERE footer_style->>'is_gradient' = 'true'
UNION ALL
SELECT 
  'Template sections with gradients',
  COUNT(*)
FROM website_templatesection
WHERE is_gradient = TRUE
UNION ALL
SELECT 
  'Template headings with gradients',
  COUNT(*)
FROM website_templatesectionheading
WHERE is_gradient = TRUE
UNION ALL
SELECT 
  'Metrics with gradients',
  COUNT(*)
FROM website_templatesection_metrics
WHERE is_gradient = TRUE;


-- ============================================================================
-- PART 10: ROLLBACK (USE WITH CAUTION)
-- ============================================================================

-- Rollback gradient additions (if needed)
/*
-- Remove gradient from headers
UPDATE settings
SET header_style = header_style - 'is_gradient' - 'gradient';

-- Remove gradient from footers
UPDATE settings
SET footer_style = footer_style - 'is_gradient' - 'gradient';

-- Remove gradient columns from website_templatesection
ALTER TABLE website_templatesection
DROP COLUMN IF EXISTS is_gradient,
DROP COLUMN IF EXISTS gradient;

-- Remove gradient columns from website_templatesectionheading
ALTER TABLE website_templatesectionheading
DROP COLUMN IF EXISTS is_gradient,
DROP COLUMN IF EXISTS gradient;

-- Remove gradient columns from website_templatesection_metrics
ALTER TABLE website_templatesection_metrics
DROP COLUMN IF EXISTS is_gradient,
DROP COLUMN IF EXISTS gradient;

-- Drop gradient presets table
DROP TABLE IF EXISTS gradient_presets CASCADE;

-- Drop utility functions
DROP FUNCTION IF EXISTS apply_gradient_preset_to_section(INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS apply_gradient_preset_to_metric(INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS apply_gradient_preset_to_header(INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS apply_gradient_preset_to_footer(INTEGER, VARCHAR);
*/


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Review and test on a staging database first
-- 2. Update TypeScript types to match new structure
-- 3. Update React components to render gradients
-- 4. Update admin UI to allow gradient configuration
-- 5. Test all gradient combinations
-- 6. Deploy to production
-- ============================================================================
