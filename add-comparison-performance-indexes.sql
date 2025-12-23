-- Performance indexes for comparison module
-- Run this migration to improve database query performance

-- Index for fetching active competitors by organization (frequently used in section-data route)
CREATE INDEX IF NOT EXISTS idx_comparison_competitor_org_active_sort 
ON comparison_competitor(organization_id, is_active, sort_order)
WHERE is_active = true;

-- Index for plan-feature lookups (used when fetching features for a specific plan)
CREATE INDEX IF NOT EXISTS idx_pricingplan_features_plan_feature 
ON pricingplan_features(pricingplan_id, feature_id);

-- Index for active pricing plans by organization (used when fetching available plans)
CREATE INDEX IF NOT EXISTS idx_pricingplan_org_active_created 
ON pricingplan(organization_id, is_active, created_at)
WHERE is_active = true;

-- Index for feature lookups by organization (used in feature queries)
CREATE INDEX IF NOT EXISTS idx_feature_organization 
ON feature(organization_id);

-- Analyze tables to update statistics after index creation
ANALYZE comparison_competitor;
ANALYZE pricingplan_features;
ANALYZE pricingplan;
ANALYZE feature;
