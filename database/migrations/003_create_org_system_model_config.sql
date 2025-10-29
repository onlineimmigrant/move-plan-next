-- Migration: Create org_system_model_config table
-- Description: Admin configuration for system models within their organization
-- Date: 2025-10-29
-- Phase: 1.3 - Database Foundation

-- ============================================================================
-- Create org_system_model_config table
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_system_model_config (
  id BIGSERIAL PRIMARY KEY,
  
  -- Links
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_model_id BIGINT NOT NULL REFERENCES ai_models_system(id) ON DELETE CASCADE,
  
  -- Admin controls
  is_enabled_for_users BOOLEAN NOT NULL DEFAULT true, -- Admin can hide/show for their users
  
  -- Per-user limits (overrides system defaults)
  token_limit_per_user INTEGER DEFAULT NULL, -- NULL = use system model's default limit
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, system_model_id),
  CONSTRAINT valid_token_limit_per_user CHECK (
    token_limit_per_user IS NULL OR token_limit_per_user > 0
  )
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Organization queries (admin viewing their config)
CREATE INDEX idx_org_system_model_config_org 
  ON org_system_model_config(organization_id);

-- Model queries (see which orgs have enabled a model)
CREATE INDEX idx_org_system_model_config_model 
  ON org_system_model_config(system_model_id);

-- Enabled models (most common user query)
CREATE INDEX idx_org_system_model_config_enabled 
  ON org_system_model_config(organization_id, is_enabled_for_users) 
  WHERE is_enabled_for_users = true;

-- Composite index for common join queries
CREATE INDEX idx_org_system_model_config_org_model 
  ON org_system_model_config(organization_id, system_model_id);

-- ============================================================================
-- Create trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_org_system_model_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_org_system_model_config_updated_at
  BEFORE UPDATE ON org_system_model_config
  FOR EACH ROW
  EXECUTE FUNCTION update_org_system_model_config_updated_at();

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON TABLE org_system_model_config IS 'Admin configuration for system AI models within their organization. Controls which models users can access and per-user token limits.';
COMMENT ON COLUMN org_system_model_config.is_enabled_for_users IS 'Admin can disable system models for their organization users. Default: true (enabled)';
COMMENT ON COLUMN org_system_model_config.token_limit_per_user IS 'Override system model token limit for this org. NULL = use system default. Admin can set custom limits per user.';
