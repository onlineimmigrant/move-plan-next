-- Multi-Currency Migration Script
-- This script adds multi-currency support to the pricingplan table
-- while maintaining full backward compatibility

-- Step 1: Add new columns (keeping existing ones unchanged)
ALTER TABLE pricingplan ADD COLUMN IF NOT EXISTS stripe_price_ids JSONB DEFAULT '{}';
ALTER TABLE pricingplan ADD COLUMN IF NOT EXISTS prices_multi_currency JSONB DEFAULT '{}';
ALTER TABLE pricingplan ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) DEFAULT 'USD';

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricingplan_stripe_price_ids ON pricingplan USING GIN (stripe_price_ids);
CREATE INDEX IF NOT EXISTS idx_pricingplan_prices_multi_currency ON pricingplan USING GIN (prices_multi_currency);
CREATE INDEX IF NOT EXISTS idx_pricingplan_base_currency ON pricingplan(base_currency);

-- Step 3: Add constraints for data validation
ALTER TABLE pricingplan ADD CONSTRAINT IF NOT EXISTS valid_base_currency 
CHECK (base_currency IN ('USD', 'EUR', 'GBP', 'PLN', 'RUB'));

-- Step 4: Migrate existing data (optional - run only if you want to migrate existing plans)
-- This populates the new fields with data from existing single-currency fields
-- Uncomment the lines below if you want to migrate existing data:

/*
UPDATE pricingplan 
SET 
  stripe_price_ids = CASE 
    WHEN stripe_price_id IS NOT NULL THEN 
      jsonb_build_object(COALESCE(currency, 'USD'), stripe_price_id)
    ELSE '{}'::jsonb
  END,
  prices_multi_currency = CASE 
    WHEN price IS NOT NULL AND currency_symbol IS NOT NULL THEN 
      jsonb_build_object(
        COALESCE(currency, 'USD'), 
        jsonb_build_object('price', price, 'symbol', currency_symbol)
      )
    ELSE '{}'::jsonb
  END,
  base_currency = COALESCE(currency, 'USD')
WHERE 
  (stripe_price_ids = '{}' OR stripe_price_ids IS NULL)
  AND (prices_multi_currency = '{}' OR prices_multi_currency IS NULL);
*/

-- Step 5: Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_pricing_plans,
  COUNT(*) FILTER (WHERE stripe_price_ids != '{}') as plans_with_multi_stripe_ids,
  COUNT(*) FILTER (WHERE prices_multi_currency != '{}') as plans_with_multi_currency,
  COUNT(*) FILTER (WHERE stripe_price_id IS NOT NULL) as plans_with_legacy_stripe_id,
  COUNT(*) FILTER (WHERE price IS NOT NULL) as plans_with_legacy_price
FROM pricingplan;

-- Display sample data structure
SELECT 
  id,
  price as legacy_price,
  currency_symbol as legacy_symbol,
  stripe_price_id as legacy_stripe_id,
  prices_multi_currency,
  stripe_price_ids,
  base_currency
FROM pricingplan 
LIMIT 3;