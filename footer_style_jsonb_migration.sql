-- Footer Style JSONB Migration Script
-- This script migrates the footer_style column from string to JSONB format

-- Step 1: Backup the current data (optional but recommended)
-- CREATE TABLE settings_backup AS SELECT * FROM settings;

-- Step 2: Check current footer_style values
SELECT id, organization_id, footer_style, pg_typeof(footer_style) as current_type
FROM settings
ORDER BY id;

-- Step 3: Convert existing string values to JSONB objects
-- This will preserve the current color as background and add default colors for links
UPDATE settings
SET footer_style = jsonb_build_object(
    'background', 
    CASE 
        WHEN footer_style::text ~ '^[a-z]+-[0-9]+$' THEN footer_style::text  -- Tailwind color (e.g., 'gray-800')
        WHEN footer_style::text ~ '^#[0-9A-Fa-f]{6}$' THEN footer_style::text  -- Hex color
        ELSE 'neutral-900'  -- Default fallback
    END,
    'color', 'neutral-400',
    'color_hover', 'white'
)
WHERE jsonb_typeof(footer_style) IS NULL 
   OR (footer_style IS NOT NULL AND footer_style::text NOT LIKE '{%');

-- Step 4: Verify the migration
SELECT 
    id, 
    organization_id,
    footer_style,
    footer_style->>'background' as background,
    footer_style->>'color' as color,
    footer_style->>'color_hover' as color_hover,
    jsonb_typeof(footer_style) as type
FROM settings
ORDER BY id;

-- Step 5: Handle NULL values by setting default JSONB
UPDATE settings
SET footer_style = jsonb_build_object(
    'background', 'neutral-900',
    'color', 'neutral-400',
    'color_hover', 'white'
)
WHERE footer_style IS NULL;

-- Step 6: Final verification
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN jsonb_typeof(footer_style) = 'object' THEN 1 END) as jsonb_objects,
    COUNT(CASE WHEN footer_style IS NULL THEN 1 END) as null_values,
    COUNT(CASE WHEN jsonb_typeof(footer_style) IS NULL THEN 1 END) as non_jsonb
FROM settings;

-- Expected output:
-- All records should have jsonb_typeof = 'object'
-- No NULL values
-- No non-JSONB values

-- Rollback script (if needed):
-- UPDATE settings s
-- SET footer_style = (SELECT footer_style FROM settings_backup WHERE id = s.id);

-- Common footer_style presets (optional - for quick setup):

-- Dark theme (default)
-- UPDATE settings SET footer_style = '{"background": "neutral-900", "color": "neutral-400", "color_hover": "white"}';

-- Light theme
-- UPDATE settings SET footer_style = '{"background": "gray-100", "color": "gray-600", "color_hover": "gray-900"}';

-- Blue theme
-- UPDATE settings SET footer_style = '{"background": "blue-900", "color": "blue-300", "color_hover": "blue-100"}';

-- Green theme  
-- UPDATE settings SET footer_style = '{"background": "green-900", "color": "green-300", "color_hover": "green-100"}';

-- Purple theme
-- UPDATE settings SET footer_style = '{"background": "purple-900", "color": "purple-300", "color_hover": "purple-100"}';

-- Custom hex colors (example)
-- UPDATE settings SET footer_style = '{"background": "#1E293B", "color": "#94A3B8", "color_hover": "#F1F5F9"}';
