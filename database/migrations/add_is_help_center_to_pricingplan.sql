-- Migration: Add is_help_center column to pricingplan table
-- Created: 2025-10-05

-- Add the is_help_center column if it doesn't exist
ALTER TABLE pricingplan 
ADD COLUMN IF NOT EXISTS is_help_center BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pricingplan_is_help_center ON pricingplan(is_help_center);

-- Add comment
COMMENT ON COLUMN pricingplan.is_help_center IS 'Flag to indicate if this pricing plan should be featured in the help center';

-- Example: Set some pricing plans as featured in help center
-- Uncomment and modify the IDs below based on your actual data

-- UPDATE pricingplan 
-- SET is_help_center = true 
-- WHERE id IN (
--   'your-plan-id-1',
--   'your-plan-id-2',
--   'your-plan-id-3'
-- );

-- Or set the first 3 active plans as featured
-- UPDATE pricingplan 
-- SET is_help_center = true 
-- WHERE id IN (
--   SELECT id 
--   FROM pricingplan 
--   WHERE is_active = true 
--   ORDER BY created_at DESC 
--   LIMIT 3
-- );

-- Verify the update
-- SELECT 
--   id,
--   product_id,
--   package,
--   price,
--   is_help_center,
--   is_active
-- FROM pricingplan
-- WHERE is_help_center = true;
