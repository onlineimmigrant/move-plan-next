-- Migration: Add display_name field to AI model tables
-- Date: 2025-11-05
-- Description: Adds display_name field for user-friendly model identification and removes uniqueness constraint from name field

-- =====================================================
-- 1. Add display_name column to ai_models table
-- =====================================================
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Copy existing name values to display_name
UPDATE ai_models 
SET display_name = name 
WHERE display_name IS NULL;

-- Make display_name NOT NULL after copying data
ALTER TABLE ai_models 
ALTER COLUMN display_name SET NOT NULL;

-- Drop unique constraints on name (both single and composite)
ALTER TABLE ai_models 
DROP CONSTRAINT IF EXISTS ai_models_name_key;
ALTER TABLE ai_models 
DROP CONSTRAINT IF EXISTS ai_models_organization_id_name_key;

-- =====================================================
-- 2. Add display_name column to ai_models_default table
-- =====================================================
ALTER TABLE ai_models_default 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Copy existing name values to display_name
UPDATE ai_models_default 
SET display_name = name 
WHERE display_name IS NULL;

-- Make display_name NOT NULL after copying data
ALTER TABLE ai_models_default 
ALTER COLUMN display_name SET NOT NULL;

-- Drop unique constraints on name (both single and composite)
ALTER TABLE ai_models_default 
DROP CONSTRAINT IF EXISTS ai_models_default_name_key;
ALTER TABLE ai_models_default 
DROP CONSTRAINT IF EXISTS ai_models_default_organization_id_name_key;

-- =====================================================
-- 3. Add display_name column to ai_models_system table
-- =====================================================
ALTER TABLE ai_models_system 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Copy existing name values to display_name
UPDATE ai_models_system 
SET display_name = name 
WHERE display_name IS NULL;

-- Make display_name NOT NULL after copying data
ALTER TABLE ai_models_system 
ALTER COLUMN display_name SET NOT NULL;

-- Drop unique constraints on name (both single and composite)
ALTER TABLE ai_models_system 
DROP CONSTRAINT IF EXISTS ai_models_system_name_key;
ALTER TABLE ai_models_system 
DROP CONSTRAINT IF EXISTS ai_models_system_organization_id_name_key;

-- =====================================================
-- Optional: Create indexes for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ai_models_display_name ON ai_models(display_name);
CREATE INDEX IF NOT EXISTS idx_ai_models_default_display_name ON ai_models_default(display_name);
CREATE INDEX IF NOT EXISTS idx_ai_models_system_display_name ON ai_models_system(display_name);

-- =====================================================
-- Verification queries (run separately to check results)
-- =====================================================
-- SELECT id, name, display_name FROM ai_models LIMIT 10;
-- SELECT id, name, display_name FROM ai_models_default LIMIT 10;
-- SELECT id, name, display_name FROM ai_models_system LIMIT 10;
