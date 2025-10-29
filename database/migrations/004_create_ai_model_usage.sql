-- Migration: Create ai_model_usage table
-- Description: Track token usage per user per model for quota enforcement
-- Date: 2025-10-29
-- Phase: 1.4 - Database Foundation

-- ============================================================================
-- Create ai_model_usage table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_model_usage (
  id BIGSERIAL PRIMARY KEY,
  
  -- User and org identification
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Model reference (polymorphic - can reference different model types)
  model_id BIGINT NOT NULL,
  model_type TEXT NOT NULL, -- 'system' | 'org_default' | 'user'
  model_name TEXT, -- Denormalized for reporting
  
  -- Usage metrics
  tokens_used INTEGER NOT NULL CHECK (tokens_used > 0),
  requests_count INTEGER NOT NULL DEFAULT 1 CHECK (requests_count > 0),
  
  -- Time period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_model_type CHECK (
    model_type IN ('system', 'org_default', 'user')
  ),
  CONSTRAINT valid_period_type CHECK (
    period_type IN ('daily', 'weekly', 'monthly')
  ),
  CONSTRAINT valid_period_range CHECK (
    period_end > period_start
  )
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- User usage queries (most common - user checking their usage)
CREATE INDEX idx_ai_model_usage_user_period 
  ON ai_model_usage(user_id, period_start DESC, period_end DESC);

-- User + model specific usage
CREATE INDEX idx_ai_model_usage_user_model 
  ON ai_model_usage(user_id, model_id, model_type, period_start DESC);

-- Organization usage queries (admin viewing org usage)
CREATE INDEX idx_ai_model_usage_org_period 
  ON ai_model_usage(organization_id, period_start DESC);

-- Model popularity analytics
CREATE INDEX idx_ai_model_usage_model 
  ON ai_model_usage(model_id, model_type);

-- Period-based queries for resets and reporting
CREATE INDEX idx_ai_model_usage_period 
  ON ai_model_usage(period_type, period_start, period_end);

-- User + period type (for quota checks)
-- Note: Removed WHERE clause with NOW() as it's not immutable
-- Instead, query should filter period_end > NOW() in application layer
CREATE INDEX idx_ai_model_usage_user_period_type 
  ON ai_model_usage(user_id, model_id, period_type, period_start DESC);

-- Composite for common aggregations
CREATE INDEX idx_ai_model_usage_org_model_period 
  ON ai_model_usage(organization_id, model_id, model_type, period_start DESC);

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON TABLE ai_model_usage IS 'Tracks token usage for quota enforcement and analytics. Records usage per user, per model, per time period.';
COMMENT ON COLUMN ai_model_usage.model_type IS 'Type of model: system (ai_models_system), org_default (ai_models_default), or user (ai_models)';
COMMENT ON COLUMN ai_model_usage.model_name IS 'Denormalized model name for reporting without joins';
COMMENT ON COLUMN ai_model_usage.tokens_used IS 'Number of tokens consumed in this request';
COMMENT ON COLUMN ai_model_usage.requests_count IS 'Number of API requests made';
COMMENT ON COLUMN ai_model_usage.period_start IS 'Start of the tracking period (e.g., beginning of month for monthly limit)';
COMMENT ON COLUMN ai_model_usage.period_end IS 'End of the tracking period (e.g., end of month for monthly limit)';
COMMENT ON COLUMN ai_model_usage.period_type IS 'Type of period for quota enforcement: daily, weekly, or monthly';

-- ============================================================================
-- Create partition-friendly structure (optional, for future scaling)
-- ============================================================================

-- Note: Consider partitioning by period_start (e.g., monthly partitions) 
-- when table grows large (millions of rows). Example:
-- 
-- CREATE TABLE ai_model_usage_2025_10 PARTITION OF ai_model_usage
--   FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
--
-- This would require converting ai_model_usage to a partitioned table first.
