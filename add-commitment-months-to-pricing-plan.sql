-- Add commitment_months field to pricing_plan table
-- This separates contract commitment duration from Stripe billing frequency
-- Example: commitment_months=12 with recurring_interval='month' and recurring_interval_count=1
--          means "12-month contract billed monthly"

ALTER TABLE pricing_plan 
ADD COLUMN IF NOT EXISTS commitment_months INTEGER;

-- Set default commitment_months based on existing recurring_interval_count
-- Assumes current recurring_interval_count represents commitment duration
UPDATE pricing_plan 
SET commitment_months = recurring_interval_count 
WHERE commitment_months IS NULL 
  AND recurring_interval_count IS NOT NULL;

-- For one-time purchases, set commitment to 1
UPDATE pricing_plan 
SET commitment_months = 1 
WHERE commitment_months IS NULL 
  AND type = 'one_time';

-- Add comment for documentation
COMMENT ON COLUMN pricing_plan.commitment_months IS 
'Contract commitment duration in months. Independent of billing frequency (recurring_interval_count). Example: commitment_months=12 means 12-month contract, regardless of whether billed monthly or annually.';
