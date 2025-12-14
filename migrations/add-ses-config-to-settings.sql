-- =====================================================
-- Add AWS SES Configuration to Settings Table
-- =====================================================
-- This migration adds AWS SES configuration fields to the settings table
-- for sending transactional and marketing emails

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS aws_access_key_id TEXT,
ADD COLUMN IF NOT EXISTS aws_secret_access_key TEXT,
ADD COLUMN IF NOT EXISTS aws_region TEXT DEFAULT 'us-east-1',
ADD COLUMN IF NOT EXISTS transactional_email TEXT,
ADD COLUMN IF NOT EXISTS marketing_email TEXT;

-- Add comment
COMMENT ON COLUMN public.settings.aws_access_key_id IS 'AWS Access Key ID for SES';
COMMENT ON COLUMN public.settings.aws_secret_access_key IS 'AWS Secret Access Key for SES (should be encrypted in production)';
COMMENT ON COLUMN public.settings.aws_region IS 'AWS Region for SES (e.g., us-east-1, eu-west-1)';
COMMENT ON COLUMN public.settings.transactional_email IS 'Default FROM email address for transactional emails';
COMMENT ON COLUMN public.settings.marketing_email IS 'Default FROM email address for marketing emails';
