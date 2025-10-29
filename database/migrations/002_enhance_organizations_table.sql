-- Migration: Enhance organizations table for AI models system
-- Description: Add pricing plan and token quota fields to organizations
-- Date: 2025-10-29
-- Phase: 1.2 - Database Foundation

-- ============================================================================
-- Add new columns to organizations table
-- ============================================================================

-- Note: organizations.type already exists and contains organization types
-- Values: immigration, solicitor, finance, education, job, beauty, doctor, 
--         services, realestate, construction, software, marketing, consulting,
--         automotive, hospitality, retail, healthcare, transportation, 
--         technology, general, platform

-- Pricing plan (determines which system models are available)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS pricing_plan TEXT DEFAULT 'free'
CHECK (pricing_plan IN ('free', 'starter', 'pro', 'enterprise'));

-- Token quota and tracking
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS token_quota_monthly INTEGER DEFAULT NULL;

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS token_usage_current INTEGER DEFAULT 0
CHECK (token_usage_current >= 0);

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS token_reset_date TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON COLUMN organizations.pricing_plan IS 'Subscription plan level. Determines access to system AI models. Default: free';
COMMENT ON COLUMN organizations.token_quota_monthly IS 'Monthly token quota for the organization. NULL = unlimited. Applies to all system model usage.';
COMMENT ON COLUMN organizations.token_usage_current IS 'Current token usage counter for the current month. Resets based on token_reset_date.';
COMMENT ON COLUMN organizations.token_reset_date IS 'Date when token quota will reset. Typically first day of next month.';

-- ============================================================================
-- Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_pricing_plan 
  ON organizations(pricing_plan);

CREATE INDEX IF NOT EXISTS idx_organizations_token_reset_date 
  ON organizations(token_reset_date) 
  WHERE token_reset_date IS NOT NULL;

-- ============================================================================
-- Initialize token_reset_date for existing organizations
-- ============================================================================

-- Set to first day of next month for existing orgs
UPDATE organizations 
SET token_reset_date = DATE_TRUNC('month', NOW() + INTERVAL '1 month')
WHERE token_reset_date IS NULL 
  AND token_quota_monthly IS NOT NULL;
