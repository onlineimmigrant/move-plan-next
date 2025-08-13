-- Migration: Add annual_size_discount field to pricingplan table
-- Created: 2025-08-13

-- Add the annual_size_discount column
ALTER TABLE pricingplan 
ADD COLUMN IF NOT EXISTS annual_size_discount DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN pricingplan.annual_size_discount IS 'Annual discount percentage (e.g., 20 for 20% off)';

-- Create index for better performance when filtering by discount
CREATE INDEX IF NOT EXISTS idx_pricingplan_annual_size_discount 
ON pricingplan(annual_size_discount) 
WHERE annual_size_discount IS NOT NULL;

-- Example update to add sample discount values (optional)
-- UPDATE pricingplan 
-- SET annual_size_discount = 20.00 
-- WHERE recurring_interval = 'month' AND annual_size_discount IS NULL;
