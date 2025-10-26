-- Add primary and secondary color configuration to settings
-- This allows organizations to customize their brand colors
-- Migration: add_theme_colors_to_settings.sql

-- Add primary color columns
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_shade INTEGER;

-- Add secondary color columns  
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS secondary_shade INTEGER;

-- Set default values for existing rows
UPDATE settings 
SET 
  primary_color = COALESCE(primary_color, 'sky'),
  primary_shade = COALESCE(primary_shade, 600),
  secondary_color = COALESCE(secondary_color, 'gray'),
  secondary_shade = COALESCE(secondary_shade, 500)
WHERE primary_color IS NULL OR primary_shade IS NULL OR secondary_color IS NULL OR secondary_shade IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN settings.primary_color IS 'Primary brand color family (e.g., sky, blue, emerald)';
COMMENT ON COLUMN settings.primary_shade IS 'Primary color shade (50-900)';
COMMENT ON COLUMN settings.secondary_color IS 'Secondary brand color family (e.g., gray, slate, zinc)';
COMMENT ON COLUMN settings.secondary_shade IS 'Secondary color shade (50-900)';
