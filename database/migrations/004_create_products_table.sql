-- Migration: Create products table
-- Created: 2025-08-12

-- First, create product_sub_type table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_sub_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic product information
    product_name VARCHAR(500) NOT NULL,
    product_description TEXT,
    price_manual DECIMAL(10,2),
    currency_manual VARCHAR(3) DEFAULT 'USD',
    currency_manual_symbol VARCHAR(5) DEFAULT '$',
    price_valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Media fields
    links_to_video TEXT[],
    links_to_image TEXT[],
    image_16_9_1200_675 TEXT,
    image_1_1_1080_1080 TEXT,
    image_4_3_800_600 TEXT,
    image_book_800_1200 TEXT,
    thumbnail_16_9_1280_1720 TEXT,
    
    -- Product classification
    product_sub_type_id INTEGER REFERENCES product_sub_type(id) ON DELETE SET NULL,
    product_sub_type_additional_id INTEGER REFERENCES product_sub_type(id) ON DELETE SET NULL,
    
    -- Display and organization
    is_displayed BOOLEAN DEFAULT true,
    is_in_pricingplan_comparison BOOLEAN DEFAULT false,
    slug VARCHAR(500) UNIQUE,
    sku VARCHAR(100),
    order_number INTEGER DEFAULT 0,
    background_color VARCHAR(7) DEFAULT '#ffffff',
    
    -- Author information
    author VARCHAR(255),
    author_2 VARCHAR(255),
    isbn VARCHAR(20),
    
    -- Connected content
    course_connected_id INTEGER,
    quiz_id INTEGER,
    video_player TEXT,
    
    -- Analytics and SEO
    view_count INTEGER DEFAULT 0,
    metadescription_for_page TEXT,
    
    -- Additional data
    details JSONB DEFAULT '{}',
    attrs JSONB DEFAULT '{}',
    
    -- Tax and pricing
    product_tax_code VARCHAR(50),
    
    -- External links
    amazon_books_url TEXT,
    compare_link_url TEXT,
    
    -- Integration
    stripe_product_id VARCHAR(255),
    
    -- Organization relationship
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT products_slug_organization_unique UNIQUE (slug, organization_id),
    CONSTRAINT products_sku_organization_unique UNIQUE (sku, organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_is_displayed ON products(is_displayed);
CREATE INDEX IF NOT EXISTS idx_products_is_in_pricingplan_comparison ON products(is_in_pricingplan_comparison);
CREATE INDEX IF NOT EXISTS idx_products_product_sub_type_id ON products(product_sub_type_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_order_number ON products(order_number);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count);

-- Create index for pricing comparison products specifically
CREATE INDEX IF NOT EXISTS idx_products_pricing_comparison_display 
ON products(organization_id, is_in_pricingplan_comparison, is_displayed, order_number);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON products 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE products IS 'Stores product information with comprehensive fields for e-commerce and educational content';
COMMENT ON COLUMN products.id IS 'Primary key';
COMMENT ON COLUMN products.created_at IS 'Timestamp when the product was created';
COMMENT ON COLUMN products.updated_at IS 'Timestamp when the product was last updated';
COMMENT ON COLUMN products.product_name IS 'Name of the product';
COMMENT ON COLUMN products.product_description IS 'Detailed description of the product';
COMMENT ON COLUMN products.price_manual IS 'Manual price override';
COMMENT ON COLUMN products.currency_manual IS 'Currency code (USD, EUR, etc.)';
COMMENT ON COLUMN products.currency_manual_symbol IS 'Currency symbol ($, €, etc.)';
COMMENT ON COLUMN products.is_in_pricingplan_comparison IS 'Whether this product should appear in pricing plan comparisons';
COMMENT ON COLUMN products.organization_id IS 'Foreign key reference to organizations table';

-- Insert sample data for testing
INSERT INTO product_sub_type (name, description, organization_id) VALUES 
('Course', 'Online courses and educational content', 1),
('Book', 'Digital and physical books', 1),
('Service', 'Professional services', 1),
('Software', 'Software applications and tools', 1),
('Consultation', 'One-on-one consultation services', 1);

-- Insert sample products
INSERT INTO products (
    product_name, 
    product_description, 
    price_manual, 
    currency_manual, 
    currency_manual_symbol,
    product_sub_type_id, 
    is_displayed, 
    is_in_pricingplan_comparison,
    slug,
    sku,
    order_number,
    organization_id
) VALUES 
(
    'Basic Plan',
    'Perfect for individuals starting their journey',
    29.99,
    'USD',
    '$',
    1,
    true,
    true,
    'basic-plan',
    'BASIC-001',
    1,
    1
),
(
    'Pro Plan',
    'Advanced features for growing businesses',
    79.99,
    'USD',
    '$',
    1,
    true,
    true,
    'pro-plan',
    'PRO-001',
    2,
    1
),
(
    'Enterprise Plan',
    'Full-featured solution for large organizations',
    199.99,
    'USD',
    '$',
    1,
    true,
    true,
    'enterprise-plan',
    'ENT-001',
    3,
    1
),
(
    'Immigration Guide Book',
    'Comprehensive guide for immigration processes',
    49.99,
    'USD',
    '$',
    2,
    true,
    false,
    'immigration-guide-book',
    'BOOK-001',
    4,
    1
);
