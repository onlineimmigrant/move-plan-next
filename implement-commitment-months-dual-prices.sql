-- IMPLEMENTATION GUIDE: Commitment Months & Dual Stripe Prices
-- =================================================================

-- STEP 1: Add commitment_months field
-- This field tracks contract duration independently of billing frequency

ALTER TABLE pricing_plan 
ADD COLUMN IF NOT EXISTS commitment_months INTEGER DEFAULT 1;

COMMENT ON COLUMN pricing_plan.commitment_months IS 
'Contract commitment duration in months (e.g., 12 = 12-month contract). Independent of billing frequency.';

-- STEP 2: Add stripe_price_id_annual field for prepay option
-- Each plan can have two Stripe prices: monthly billing + annual prepay

ALTER TABLE pricing_plan 
ADD COLUMN IF NOT EXISTS stripe_price_id_annual TEXT;

COMMENT ON COLUMN pricing_plan.stripe_price_id_annual IS 
'Stripe price ID for annual prepayment option (with annual_size_discount applied). NULL if not offered.';

-- STEP 3: Migrate existing data
-- Set commitment_months based on current recurring_interval_count

UPDATE pricing_plan 
SET commitment_months = COALESCE(recurring_interval_count, 1)
WHERE commitment_months IS NULL OR commitment_months = 1;

-- STEP 4: Reset recurring_interval_count to 1 for proper Stripe billing
-- After this, recurring_interval_count=1 means "bill every interval"
-- commitment_months tracks total contract duration

UPDATE pricing_plan
SET recurring_interval_count = 1
WHERE type = 'recurring' 
  AND recurring_interval_count IS NOT NULL 
  AND recurring_interval_count > 1;

-- STEP 5: Document the new model
-- ===============================
-- FIELD USAGE:
--   type: 'recurring' | 'one_time'
--   recurring_interval: 'month' | 'year' (for recurring only)
--   recurring_interval_count: 1 (always 1 for proper Stripe billing)
--   commitment_months: 12, 24, etc. (contract duration)
--   annual_size_discount: 15 (15% discount for annual prepay)
--   price: monthly price in cents
--   stripe_price_id: Stripe price for monthly billing
--   stripe_price_id_annual: Stripe price for annual prepay (calculated with discount)

-- EXAMPLE PLAN CONFIGURATION:
-- ===========================
-- "Business OS Pro - 12 Month Plan"
--   type: 'recurring'
--   recurring_interval: 'month'
--   recurring_interval_count: 1
--   commitment_months: 12
--   price: 6200  (£62.00/month)
--   annual_size_discount: 20
--   
--   → Creates TWO Stripe prices:
--     1. Monthly: £62/month × 12 months = £744 total
--        Stripe: interval='month', interval_count=1, unit_amount=6200
--     
--     2. Annual Prepay: £62 × 12 × 0.80 = £595.20 upfront
--        Stripe: interval='year', interval_count=1, unit_amount=59520

-- STRIPE PRICE CREATION LOGIC:
-- =============================
-- In /api/pricingplans or sync endpoints:

-- MONTHLY BILLING PRICE:
-- {
--   product: stripe_product_id,
--   unit_amount: price,  // monthly price
--   currency: currency,
--   recurring: {
--     interval: recurring_interval,  // 'month'
--     interval_count: 1
--   }
-- }

-- ANNUAL PREPAY PRICE (if annual_size_discount > 0):
-- {
--   product: stripe_product_id,
--   unit_amount: Math.round(price * commitment_months * (1 - annual_size_discount / 100)),
--   currency: currency,
--   recurring: {
--     interval: 'year',
--     interval_count: 1
--   },
--   metadata: {
--     billing_type: 'annual_prepay',
--     commitment_months: commitment_months,
--     discount_percent: annual_size_discount
--   }
-- }

-- UI DISPLAY LOGIC:
-- =================
-- Show BOTH options if annual_size_discount > 0:
-- 
-- Option 1: "Pay Monthly"
--   £62/month for 12 months
--   Total: £744
--   [Select Monthly Billing] → use stripe_price_id
-- 
-- Option 2: "Pay Annually" (20% off)
--   £595.20/year (save £148.80)
--   [Select Annual Prepay] → use stripe_price_id_annual

-- CALCULATION HELPER FUNCTIONS:
-- ==============================

-- Get total contract value (monthly billing):
CREATE OR REPLACE FUNCTION get_total_contract_value_monthly(plan_id UUID)
RETURNS INTEGER AS $$
  SELECT price * commitment_months
  FROM pricing_plan
  WHERE id = plan_id;
$$ LANGUAGE SQL;

-- Get annual prepay amount (with discount):
CREATE OR REPLACE FUNCTION get_annual_prepay_amount(plan_id UUID)
RETURNS INTEGER AS $$
  SELECT ROUND(price * commitment_months * (1 - COALESCE(annual_size_discount, 0) / 100.0))
  FROM pricing_plan
  WHERE id = plan_id;
$$ LANGUAGE SQL;

-- Get savings from annual prepay:
CREATE OR REPLACE FUNCTION get_annual_savings(plan_id UUID)
RETURNS INTEGER AS $$
  SELECT price * commitment_months - get_annual_prepay_amount(plan_id)
  FROM pricing_plan
  WHERE id = plan_id;
$$ LANGUAGE SQL;
