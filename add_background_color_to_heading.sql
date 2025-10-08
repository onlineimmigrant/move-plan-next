-- Add background_color column to website_templatesectionheading table
-- This allows custom background colors for each heading section

ALTER TABLE website_templatesectionheading 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) DEFAULT 'white';

-- Add comment for documentation
COMMENT ON COLUMN website_templatesectionheading.background_color IS 'Background color for the heading section (CSS color value or Tailwind color name)';
