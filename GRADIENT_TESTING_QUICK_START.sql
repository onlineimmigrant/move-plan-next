-- ============================================================================
-- GRADIENT TESTING QUICK START
-- ============================================================================
-- Use these queries to quickly test gradient implementations
-- Replace IDs with your actual database IDs
-- ============================================================================

-- ============================================================================
-- 1. TEST HEADER GRADIENT
-- ============================================================================

-- Option A: Use a preset
SELECT apply_gradient_preset_to_header(1, 'Ocean Blue');

-- Option B: Custom gradient
UPDATE settings
SET header_style = header_style || 
  '{"is_gradient": true, "gradient": {"from": "sky-400", "via": "white", "to": "indigo-500"}}'::jsonb
WHERE id = 1;

-- Disable header gradient
UPDATE settings
SET header_style = header_style || '{"is_gradient": false}'::jsonb
WHERE id = 1;


-- ============================================================================
-- 2. TEST FOOTER GRADIENT
-- ============================================================================

-- Option A: Use a preset
SELECT apply_gradient_preset_to_footer(1, 'Dark Professional');

-- Option B: Custom gradient
UPDATE settings
SET footer_style = footer_style || 
  '{"is_gradient": true, "gradient": {"from": "gray-900", "via": "slate-900", "to": "neutral-950"}}'::jsonb
WHERE id = 1;

-- Disable footer gradient
UPDATE settings
SET footer_style = footer_style || '{"is_gradient": false}'::jsonb
WHERE id = 1;


-- ============================================================================
-- 3. TEST TEMPLATE SECTION GRADIENT
-- ============================================================================

-- Find your section IDs first
SELECT id, section_title FROM website_templatesection ORDER BY id;

-- Option A: Use a preset
SELECT apply_gradient_preset_to_section(1, 'Royal Purple');

-- Option B: Custom gradient
UPDATE website_templatesection
SET 
  is_gradient = TRUE,
  gradient = '{"from": "purple-400", "via": "fuchsia-400", "to": "pink-500"}'::jsonb
WHERE id = 1; -- Replace with your section ID

-- 2-color gradient (no via)
UPDATE website_templatesection
SET 
  is_gradient = TRUE,
  gradient = '{"from": "blue-500", "to": "purple-600"}'::jsonb
WHERE id = 1;

-- Disable section gradient
UPDATE website_templatesection
SET is_gradient = FALSE
WHERE id = 1;


-- ============================================================================
-- 4. TEST TEMPLATE HEADING SECTION GRADIENT
-- ============================================================================

-- Find your heading section IDs first
SELECT id, name FROM website_templatesectionheading ORDER BY id;

-- Custom gradient
UPDATE website_templatesectionheading
SET 
  is_gradient = TRUE,
  gradient = '{"from": "blue-600", "via": "indigo-500", "to": "purple-600"}'::jsonb
WHERE id = 1; -- Replace with your heading ID

-- Disable heading gradient
UPDATE website_templatesectionheading
SET is_gradient = FALSE
WHERE id = 1;


-- ============================================================================
-- 5. TEST METRIC GRADIENT
-- ============================================================================

-- Find your metric IDs first
SELECT id, title FROM website_templatesection_metrics ORDER BY id LIMIT 10;

-- Option A: Use a preset
SELECT apply_gradient_preset_to_metric(1, 'Fresh Growth');

-- Option B: Custom gradient
UPDATE website_templatesection_metrics
SET 
  is_gradient = TRUE,
  gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
WHERE id = 1; -- Replace with your metric ID

-- Disable metric gradient
UPDATE website_templatesection_metrics
SET is_gradient = FALSE
WHERE id = 1;


-- ============================================================================
-- 6. ENABLE GRADIENTS FOR ENTIRE PAGE
-- ============================================================================

-- Header: Ocean Blue
SELECT apply_gradient_preset_to_header(1, 'Ocean Blue');

-- Footer: Dark Professional
SELECT apply_gradient_preset_to_footer(1, 'Dark Professional');

-- First section: Royal Purple
UPDATE website_templatesection
SET 
  is_gradient = TRUE,
  gradient = '{"from": "purple-400", "via": "fuchsia-400", "to": "pink-500"}'::jsonb
WHERE id = 1;

-- First heading: Vibrant Blue
UPDATE website_templatesectionheading
SET 
  is_gradient = TRUE,
  gradient = '{"from": "blue-600", "via": "indigo-500", "to": "purple-600"}'::jsonb
WHERE id = 1;

-- All metrics in first section: Fresh Growth
UPDATE website_templatesection_metrics
SET 
  is_gradient = TRUE,
  gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
WHERE website_templatesection_id = 1; -- Replace with your section ID


-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Check header gradient status
SELECT 
  id,
  header_style->>'is_gradient' as header_gradient_enabled,
  header_style->'gradient' as header_gradient_colors
FROM settings
WHERE id = 1;

-- Check footer gradient status
SELECT 
  id,
  footer_style->>'is_gradient' as footer_gradient_enabled,
  footer_style->'gradient' as footer_gradient_colors
FROM settings
WHERE id = 1;

-- Check all sections with gradients
SELECT 
  id,
  section_title,
  is_gradient,
  gradient
FROM website_templatesection
WHERE is_gradient = TRUE;

-- Check all headings with gradients
SELECT 
  id,
  name,
  is_gradient,
  gradient
FROM website_templatesectionheading
WHERE is_gradient = TRUE;

-- Check all metrics with gradients
SELECT 
  id,
  title,
  is_gradient,
  gradient
FROM website_templatesection_metrics
WHERE is_gradient = TRUE;

-- Summary of all gradients
SELECT 
  'Headers' as component,
  COUNT(*) as total,
  SUM(CASE WHEN header_style->>'is_gradient' = 'true' THEN 1 ELSE 0 END) as with_gradient
FROM settings
UNION ALL
SELECT 
  'Footers',
  COUNT(*),
  SUM(CASE WHEN footer_style->>'is_gradient' = 'true' THEN 1 ELSE 0 END)
FROM settings
UNION ALL
SELECT 
  'Template Sections',
  COUNT(*),
  SUM(CASE WHEN is_gradient = TRUE THEN 1 ELSE 0 END)
FROM website_templatesection
UNION ALL
SELECT 
  'Heading Sections',
  COUNT(*),
  SUM(CASE WHEN is_gradient = TRUE THEN 1 ELSE 0 END)
FROM website_templatesectionheading
UNION ALL
SELECT 
  'Metrics',
  COUNT(*),
  SUM(CASE WHEN is_gradient = TRUE THEN 1 ELSE 0 END)
FROM website_templatesection_metrics;


-- ============================================================================
-- 8. PRESET REFERENCE
-- ============================================================================

-- View all available presets
SELECT 
  id,
  name,
  description,
  gradient_from as "from",
  gradient_via as via,
  gradient_to as "to",
  use_case
FROM gradient_presets
ORDER BY id;

-- Find presets by color family
SELECT name, description, use_case
FROM gradient_presets
WHERE 
  gradient_from LIKE '%blue%' OR 
  gradient_via LIKE '%blue%' OR 
  gradient_to LIKE '%blue%'
ORDER BY name;


-- ============================================================================
-- 9. BULK OPERATIONS
-- ============================================================================

-- Enable gradient for ALL sections (use carefully!)
UPDATE website_templatesection
SET 
  is_gradient = TRUE,
  gradient = '{"from": "gray-50", "via": "white", "to": "gray-50"}'::jsonb
WHERE is_gradient = FALSE OR is_gradient IS NULL;

-- Enable gradient for ALL metrics (use carefully!)
UPDATE website_templatesection_metrics
SET 
  is_gradient = TRUE,
  gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
WHERE is_gradient = FALSE OR is_gradient IS NULL;

-- Disable ALL gradients (emergency reset)
UPDATE settings
SET 
  header_style = header_style || '{"is_gradient": false}'::jsonb,
  footer_style = footer_style || '{"is_gradient": false}'::jsonb;

UPDATE website_templatesection
SET is_gradient = FALSE;

UPDATE website_templatesectionheading
SET is_gradient = FALSE;

UPDATE website_templatesection_metrics
SET is_gradient = FALSE;


-- ============================================================================
-- 10. TROUBLESHOOTING
-- ============================================================================

-- Check for sections without gradient fields
SELECT id, section_title
FROM website_templatesection
WHERE is_gradient IS NULL;

-- Check for metrics without gradient fields
SELECT id, title
FROM website_templatesection_metrics
WHERE is_gradient IS NULL;

-- Check for headings without gradient fields
SELECT id, name
FROM website_templatesectionheading
WHERE is_gradient IS NULL;

-- Find empty gradient objects
SELECT id, section_title, gradient
FROM website_templatesection
WHERE is_gradient = TRUE 
  AND (gradient IS NULL OR gradient = '{}'::jsonb);


-- ============================================================================
-- QUICK COPY-PASTE EXAMPLES
-- ============================================================================

-- Beautiful header gradient:
-- SELECT apply_gradient_preset_to_header(1, 'Ocean Blue');

-- Professional footer gradient:
-- SELECT apply_gradient_preset_to_footer(1, 'Dark Professional');

-- Vibrant section gradient:
-- UPDATE website_templatesection
-- SET is_gradient = TRUE, gradient = '{"from": "purple-400", "via": "fuchsia-400", "to": "pink-500"}'::jsonb
-- WHERE id = 1;

-- Success metric gradient:
-- UPDATE website_templatesection_metrics
-- SET is_gradient = TRUE, gradient = '{"from": "emerald-400", "via": "green-400", "to": "teal-500"}'::jsonb
-- WHERE id = 1;
