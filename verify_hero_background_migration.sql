-- Verification script for hero background migration
-- Run this after executing hero_background_migration.sql

-- Check that background_style column exists and has data
SELECT
    'background_style column exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'website_hero'
        AND column_name = 'background_style'
    ) THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
-- Check how many records have background_style data
SELECT
    'Records with background_style data' as check_name,
    COUNT(*) || ' records' as status
FROM website_hero
WHERE background_style IS NOT NULL
UNION ALL
-- Check that old columns still exist (before cleanup)
SELECT
    'Old background_color column exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'website_hero'
        AND column_name = 'background_color'
    ) THEN 'EXISTS (can be dropped after verification)' ELSE 'ALREADY DROPPED' END as status
UNION ALL
-- Sample of migrated data
SELECT
    'Sample migrated data - ID: ' || id as check_name,
    'color: ' || (background_style->>'color') ||
    CASE WHEN background_style->'gradient' IS NOT NULL
         THEN ', gradient: ' || (background_style->'gradient'->>'from') || ' -> ' || (background_style->'gradient'->>'to')
         ELSE ''
    END ||
    CASE WHEN background_style->>'video' IS NOT NULL
         THEN ', video: ' || (background_style->>'video')
         ELSE ''
    END as status
FROM website_hero
WHERE background_style IS NOT NULL
ORDER BY id
LIMIT 3;