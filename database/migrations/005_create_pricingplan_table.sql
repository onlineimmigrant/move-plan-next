-- Migration: Create pricingplan table
-- Created: 2025-08-12

CREATE TABLE IF NOT EXISTS pricingplan (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic pricing information
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    currency_symbol VARCHAR(5) DEFAULT '$',
    recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('month', 'year', 'week', 'day', 'one_time')),
    recurring_interval_count INTEGER DEFAULT 1,
    
    -- Calculated prices
    monthly_price_calculated DECIMAL(10,2),
    total_price_calculated DECIMAL(10,2),
    
    -- Promotion fields
    is_promotion BOOLEAN DEFAULT false,
    promotion_percent INTEGER,
    promotion_price DECIMAL(10,2),
    valid_until TIMESTAMP WITH TIME ZONE,
    annual_size_discount DECIMAL(5,2), -- New field for annual discount percentage
    
    -- Integration fields
    stripe_price_id VARCHAR(255),
    
    -- Content and description
    package VARCHAR(500),
    description TEXT,
    measure VARCHAR(100),
    
    -- Digital assets
    epub_file TEXT,
    pdf_file TEXT,
    digital_asset_access BOOLEAN DEFAULT false,
    
    -- Timing and activation
    date DATE,
    display_date VARCHAR(100),
    time_slot_duration INTEGER, -- in minutes
    activation_duration INTEGER, -- in days
    grants_permanent_ownership BOOLEAN DEFAULT false,
    
    -- Status and ordering
    is_active BOOLEAN DEFAULT true,
    order_number INTEGER DEFAULT 0,
    type VARCHAR(100),
    slug VARCHAR(500),
    
    -- External links
    amazon_books_url TEXT,
    
    -- Additional data
    details JSONB DEFAULT '{}',
    attrs JSONB DEFAULT '{}',
    
    -- Product relationship
    product_id INTEGER REFERENCES product(id) ON DELETE CASCADE,
    
    -- Organization relationship
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT pricingplan_slug_organization_unique UNIQUE (slug, organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricingplan_organization_id ON pricingplan(organization_id);
CREATE INDEX IF NOT EXISTS idx_pricingplan_product_id ON pricingplan(product_id);
CREATE INDEX IF NOT EXISTS idx_pricingplan_is_active ON pricingplan(is_active);
CREATE INDEX IF NOT EXISTS idx_pricingplan_recurring_interval ON pricingplan(recurring_interval);
CREATE INDEX IF NOT EXISTS idx_pricingplan_order_number ON pricingplan(order_number);
CREATE INDEX IF NOT EXISTS idx_pricingplan_is_promotion ON pricingplan(is_promotion);
CREATE INDEX IF NOT EXISTS idx_pricingplan_valid_until ON pricingplan(valid_until);
CREATE INDEX IF NOT EXISTS idx_pricingplan_created_at ON pricingplan(created_at);

-- Create index for active pricing plans specifically
CREATE INDEX IF NOT EXISTS idx_pricingplan_active_display 
ON pricingplan(organization_id, product_id, is_active, order_number);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_pricingplan_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_pricingplan_updated_at 
BEFORE UPDATE ON pricingplan 
FOR EACH ROW EXECUTE FUNCTION update_pricingplan_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE pricingplan IS 'Stores pricing plan information with comprehensive fields for subscription and one-time purchases';
COMMENT ON COLUMN pricingplan.id IS 'Primary key';
COMMENT ON COLUMN pricingplan.price IS 'Base price of the plan';
COMMENT ON COLUMN pricingplan.currency IS 'Currency code (USD, EUR, etc.)';
COMMENT ON COLUMN pricingplan.currency_symbol IS 'Currency symbol ($, €, etc.)';
COMMENT ON COLUMN pricingplan.recurring_interval IS 'Billing interval: month, year, week, day, or one_time';
COMMENT ON COLUMN pricingplan.recurring_interval_count IS 'Number of intervals (e.g., 3 for every 3 months)';
COMMENT ON COLUMN pricingplan.is_promotion IS 'Whether this is a promotional pricing';
COMMENT ON COLUMN pricingplan.promotion_percent IS 'Discount percentage for promotions';
COMMENT ON COLUMN pricingplan.digital_asset_access IS 'Whether plan includes digital asset access';
COMMENT ON COLUMN pricingplan.grants_permanent_ownership IS 'Whether plan grants permanent ownership';
COMMENT ON COLUMN pricingplan.product_id IS 'Foreign key reference to products table';
COMMENT ON COLUMN pricingplan.organization_id IS 'Foreign key reference to organizations table';

-- Insert sample pricing plans
INSERT INTO pricingplan (
    price,
    currency,
    currency_symbol,
    recurring_interval,
    package,
    description,
    monthly_price_calculated,
    is_active,
    order_number,
    product_id,
    organization_id,
    type,
    slug
) VALUES 
-- Basic Plan pricing
(
    29.99,
    'USD',
    '$',
    'month',
    'Basic Plan',
    'Perfect for individuals starting their journey',
    29.99,
    true,
    1,
    1, -- Assuming Basic Plan product has id 1
    1,
    'subscription',
    'basic-monthly'
),
(
    299.99,
    'USD',
    '$',
    'year',
    'Basic Plan (Annual)',
    'Perfect for individuals starting their journey - Save 17%',
    24.99,
    true,
    2,
    1,
    1,
    'subscription',
    'basic-annual'
),
-- Pro Plan pricing
(
    79.99,
    'USD',
    '$',
    'month',
    'Pro Plan',
    'Advanced features for growing businesses',
    79.99,
    true,
    3,
    2, -- Assuming Pro Plan product has id 2
    1,
    'subscription',
    'pro-monthly'
),
(
    799.99,
    'USD',
    '$',
    'year',
    'Pro Plan (Annual)',
    'Advanced features for growing businesses - Save 17%',
    66.66,
    true,
    4,
    2,
    1,
    'subscription',
    'pro-annual'
),
-- Enterprise Plan pricing
(
    199.99,
    'USD',
    '$',
    'month',
    'Enterprise Plan',
    'Full-featured solution for large organizations',
    199.99,
    true,
    5,
    3, -- Assuming Enterprise Plan product has id 3
    1,
    'subscription',
    'enterprise-monthly'
),
(
    1999.99,
    'USD',
    '$',
    'year',
    'Enterprise Plan (Annual)',
    'Full-featured solution for large organizations - Save 17%',
    166.66,
    true,
    6,
    3,
    1,
    'subscription',
    'enterprise-annual'
),
-- One-time purchase example
(
    49.99,
    'USD',
    '$',
    'one_time',
    'Immigration Guide Book',
    'Comprehensive guide for immigration processes - One-time purchase',
    0, -- No monthly calculation for one-time
    true,
    7,
    4, -- Assuming Immigration Guide Book product has id 4
    1,
    'one_time',
    'immigration-guide-book'
);
