-- Migration: Add Stripe API keys to organizations table
-- Description: Store Stripe keys per organization for multi-tenant payment processing
-- Date: 2025-11-23

-- ============================================================================
-- Add Stripe key columns to organizations table
-- ============================================================================

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT DEFAULT NULL;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN organizations.stripe_secret_key IS 'Stripe secret key (server-side only, never expose to client). Format: sk_test_... or sk_live_...';
COMMENT ON COLUMN organizations.stripe_publishable_key IS 'Stripe publishable key (safe to expose to client for checkout). Format: pk_test_... or pk_live_...';
COMMENT ON COLUMN organizations.stripe_webhook_secret IS 'Stripe webhook signing secret for verifying webhook events. Format: whsec_...';

-- ============================================================================
-- Create indexes for faster lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_keys 
  ON organizations(id) 
  WHERE stripe_secret_key IS NOT NULL;

-- ============================================================================
-- Note: No RLS changes needed - organizations table already has proper RLS
-- ============================================================================
