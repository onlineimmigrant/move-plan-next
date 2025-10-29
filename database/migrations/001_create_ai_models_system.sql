-- Migration: Create ai_models_system table
-- Description: System-wide AI model templates managed by superadmin
-- Date: 2025-10-29
-- Phase: 1.1 - Database Foundation

-- ============================================================================
-- Create ai_models_system table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_models_system (
  id BIGSERIAL PRIMARY KEY,
  
  -- Basic model information
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  task JSONB DEFAULT NULL,
  system_message TEXT NOT NULL,
  
  -- API configuration
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  max_tokens INTEGER NOT NULL DEFAULT 200,
  
  -- Visual
  icon TEXT DEFAULT NULL,
  
  -- Targeting: organization types (from existing organizations.type)
  -- Empty array = available to all organization types
  -- Example: ['immigration', 'solicitor', 'education']
  organization_types TEXT[] DEFAULT '{}',
  
  -- Pricing plan requirements
  -- Models available only to orgs with this plan or higher
  -- 'free' | 'starter' | 'pro' | 'enterprise'
  required_plan TEXT NOT NULL DEFAULT 'free',
  
  -- Token/Usage limits
  token_limit_period TEXT DEFAULT NULL, -- 'daily' | 'weekly' | 'monthly' | null (unlimited)
  token_limit_amount INTEGER DEFAULT NULL, -- null = unlimited
  
  -- Features
  is_free BOOLEAN NOT NULL DEFAULT false, -- Free model (no token counting)
  is_trial BOOLEAN NOT NULL DEFAULT false, -- Trial model
  trial_expires_days INTEGER DEFAULT NULL, -- null = no expiration
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true, -- System-wide active status
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Show in featured section
  
  -- Metadata
  description TEXT DEFAULT NULL,
  tags TEXT[] DEFAULT '{}', -- For categorization/search
  sort_order INTEGER NOT NULL DEFAULT 0, -- Display order
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_token_limit_period CHECK (
    token_limit_period IS NULL OR 
    token_limit_period IN ('daily', 'weekly', 'monthly')
  ),
  CONSTRAINT valid_required_plan CHECK (
    required_plan IN ('free', 'starter', 'pro', 'enterprise')
  ),
  CONSTRAINT valid_token_limit_amount CHECK (
    token_limit_amount IS NULL OR token_limit_amount > 0
  ),
  CONSTRAINT valid_trial_expires_days CHECK (
    trial_expires_days IS NULL OR trial_expires_days > 0
  )
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Active models (most common query)
CREATE INDEX idx_ai_models_system_active 
  ON ai_models_system(is_active) 
  WHERE is_active = true;

-- Organization types filtering (GIN index for array containment)
CREATE INDEX idx_ai_models_system_org_types 
  ON ai_models_system USING GIN(organization_types);

-- Pricing plan filtering
CREATE INDEX idx_ai_models_system_required_plan 
  ON ai_models_system(required_plan);

-- Featured models
CREATE INDEX idx_ai_models_system_featured 
  ON ai_models_system(is_featured) 
  WHERE is_featured = true;

-- Tags for search (GIN index for array containment)
CREATE INDEX idx_ai_models_system_tags 
  ON ai_models_system USING GIN(tags);

-- Sort order for display
CREATE INDEX idx_ai_models_system_sort_order 
  ON ai_models_system(sort_order, created_at);

-- Role filtering
CREATE INDEX idx_ai_models_system_role 
  ON ai_models_system(role);

-- ============================================================================
-- Create trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_models_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_models_system_updated_at
  BEFORE UPDATE ON ai_models_system
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_models_system_updated_at();

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON TABLE ai_models_system IS 'System-wide AI model templates created and managed by superadmin';
COMMENT ON COLUMN ai_models_system.organization_types IS 'Array of organization types this model is available to. Empty array = available to all types. Values should match organizations.type column.';
COMMENT ON COLUMN ai_models_system.required_plan IS 'Minimum pricing plan required to access this model. Hierarchy: free < starter < pro < enterprise';
COMMENT ON COLUMN ai_models_system.token_limit_period IS 'Time period for token limit enforcement. NULL = unlimited';
COMMENT ON COLUMN ai_models_system.token_limit_amount IS 'Maximum tokens allowed per period. NULL = unlimited';
COMMENT ON COLUMN ai_models_system.is_free IS 'If true, no token counting or limits apply to this model';
COMMENT ON COLUMN ai_models_system.is_trial IS 'If true, this is a trial model with expiration';
COMMENT ON COLUMN ai_models_system.trial_expires_days IS 'Number of days until trial expires. NULL = no expiration';
