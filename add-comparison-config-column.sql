-- Add comparison_config column to store comparison section configuration
ALTER TABLE website_templatesection
ADD COLUMN IF NOT EXISTS comparison_config JSONB DEFAULT NULL;

COMMENT ON COLUMN website_templatesection.comparison_config IS 'Configuration for comparison sections: competitor_ids, pricing options, feature filters, etc.';
