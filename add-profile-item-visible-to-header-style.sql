-- Add profile_item_visible column to header_style table
ALTER TABLE header_style 
ADD COLUMN IF NOT EXISTS profile_item_visible BOOLEAN DEFAULT true;

-- Update existing rows to have profile item visible by default
UPDATE header_style 
SET profile_item_visible = true 
WHERE profile_item_visible IS NULL;
