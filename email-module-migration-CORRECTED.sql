-- =====================================================
-- EMAIL MODULE - COMPLETE DATABASE MIGRATION
-- =====================================================
-- This script creates all required tables for the Email module
-- FIXES APPLIED:
-- 1. Line 165: "references" TEXT[] (quoted to escape SQL keyword)
-- 2. Line 195: template_id BIGINT (not UUID - must match email_template.id)
-- 3. Line 240: template_id BIGINT (not UUID - must match email_template.id)
-- =====================================================

-- =====================================================
-- PART 1: Add email_branding to settings table
-- =====================================================

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS email_branding JSONB DEFAULT '{
  "use_primary_color": true,
  "use_seo_og_image_as_logo": true,
  "custom_logo_url": null,
  "custom_primary_color": null,
  "font_family": "Arial, Helvetica, sans-serif",
  "button_border_radius": 8,
  "container_max_width": 600
}'::jsonb;

-- =====================================================
-- PART 2: Create Email Module Tables
-- =====================================================

-- 1. Email Accounts (Connected Gmail/Outlook accounts)
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'ses')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Connection metadata
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  sync_error TEXT,
  
  -- Stats
  total_emails_received INTEGER DEFAULT 0,
  total_emails_sent INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, email_address)
);

CREATE INDEX idx_email_accounts_org ON public.email_accounts(organization_id);
CREATE INDEX idx_email_accounts_user ON public.email_accounts(user_id);
CREATE INDEX idx_email_accounts_provider ON public.email_accounts(provider);

-- 2. Email Threads (Conversations)
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  
  -- Thread metadata
  subject TEXT NOT NULL,
  participants TEXT[], -- Array of email addresses
  
  -- Linking
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  -- Thread stats
  message_count INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  
  -- Timestamps
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_threads_org ON public.email_threads(organization_id);
CREATE INDEX idx_email_threads_account ON public.email_threads(account_id);
CREATE INDEX idx_email_threads_ticket ON public.email_threads(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX idx_email_threads_booking ON public.email_threads(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_email_threads_unread ON public.email_threads(organization_id, is_read) WHERE is_read = false;

-- 3. Email Messages (Individual emails in threads)
CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  
  -- Message identifiers (from provider)
  external_id TEXT, -- Gmail message ID, Outlook message ID
  in_reply_to TEXT, -- Message-ID this is replying to
  "references" TEXT[], -- FIXED: Quoted to escape SQL keyword - Array of Message-IDs in thread
  
  -- Email headers
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  reply_to TEXT,
  
  subject TEXT NOT NULL,
  
  -- Content
  body_html TEXT,
  body_text TEXT,
  snippet TEXT, -- First 200 chars preview
  
  -- Metadata
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_messages_org ON public.email_messages(organization_id);
CREATE INDEX idx_email_messages_thread ON public.email_messages(thread_id);
CREATE INDEX idx_email_messages_account ON public.email_messages(account_id);
CREATE INDEX idx_email_messages_external ON public.email_messages(external_id);
CREATE INDEX idx_email_messages_direction ON public.email_messages(direction);
CREATE INDEX idx_email_messages_sent_at ON public.email_messages(sent_at);

-- 4. Email Attachments
CREATE TABLE IF NOT EXISTS public.email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.email_messages(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  
  -- Storage
  storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'r2', 's3')),
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  
  -- Metadata from provider
  external_id TEXT, -- Gmail attachment ID, Outlook attachment ID
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_attachments_message ON public.email_attachments(message_id);

-- 5. Email Campaigns (Marketing email campaigns)
-- NOTE: Created before email_sent_log because email_sent_log references this table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  
  -- Template reference
  template_id BIGINT REFERENCES public.email_template(id) ON DELETE SET NULL, -- FIXED: BIGINT not UUID
  
  -- Campaign status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_complained INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_org ON public.email_campaigns(organization_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON public.email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- 6. Email Sent Log (Transactional & Marketing emails sent via SES)
-- NOTE: Created after email_campaigns because it references that table
CREATE TABLE IF NOT EXISTS public.email_sent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Template reference (NULL for inbox emails)
  template_id BIGINT REFERENCES public.email_template(id) ON DELETE SET NULL, -- FIXED: BIGINT not UUID
  template_type TEXT, -- welcome, order_confirmation, etc.
  
  -- Campaign reference (NULL for transactional emails)
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  
  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  
  subject TEXT NOT NULL,
  
  -- Delivery status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'complained', 'failed')),
  ses_message_id TEXT,
  
  -- Engagement tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  
  -- Metadata
  sent_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_sent_log_org ON public.email_sent_log(organization_id);
CREATE INDEX idx_email_sent_log_template ON public.email_sent_log(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_email_sent_log_campaign ON public.email_sent_log(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_email_sent_log_status ON public.email_sent_log(status);
CREATE INDEX idx_email_sent_log_sent_at ON public.email_sent_log(sent_at);

-- 7. Email Lists (Subscriber lists for marketing)
CREATE TABLE IF NOT EXISTS public.email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Stats
  subscriber_count INTEGER DEFAULT 0,
  active_subscriber_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_email_lists_org ON public.email_lists(organization_id);

-- 8. Email List Subscribers
CREATE TABLE IF NOT EXISTS public.email_list_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  name TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced', 'complained')),
  source TEXT, -- 'manual', 'import', 'form', 'api'
  
  -- Preferences
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(list_id, email)
);

CREATE INDEX idx_email_list_subscribers_list ON public.email_list_subscribers(list_id);
CREATE INDEX idx_email_list_subscribers_email ON public.email_list_subscribers(email);
CREATE INDEX idx_email_list_subscribers_status ON public.email_list_subscribers(status);

-- 9. Email Campaign Recipients (Many-to-many: campaigns to lists)
CREATE TABLE IF NOT EXISTS public.email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, list_id)
);

CREATE INDEX idx_email_campaign_recipients_campaign ON public.email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_campaign_recipients_list ON public.email_campaign_recipients(list_id);

-- =====================================================
-- PART 3: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_list_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- email_accounts: Users can only access accounts from their organization
CREATE POLICY email_accounts_org_isolation ON public.email_accounts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_threads: Org-level access
CREATE POLICY email_threads_org_isolation ON public.email_threads
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_messages: Org-level access
CREATE POLICY email_messages_org_isolation ON public.email_messages
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_attachments: Org-level access
CREATE POLICY email_attachments_org_isolation ON public.email_attachments
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_sent_log: Org-level access
CREATE POLICY email_sent_log_org_isolation ON public.email_sent_log
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_campaigns: Org-level access
CREATE POLICY email_campaigns_org_isolation ON public.email_campaigns
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_lists: Org-level access
CREATE POLICY email_lists_org_isolation ON public.email_lists
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_list_subscribers: Org-level access
CREATE POLICY email_list_subscribers_org_isolation ON public.email_list_subscribers
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- email_campaign_recipients: Org-level access
CREATE POLICY email_campaign_recipients_org_isolation ON public.email_campaign_recipients
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- PART 4: Helper Functions & Triggers
-- =====================================================

-- Function to get email branding settings
CREATE OR REPLACE FUNCTION get_email_branding(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  branding JSONB;
  primary_col TEXT;
  logo_url TEXT;
BEGIN
  -- Get settings for the organization
  SELECT 
    email_branding,
    primary_color,
    seo_og_image
  INTO branding, primary_col, logo_url
  FROM public.settings
  WHERE organization_id = org_id;
  
  -- If no custom branding set, use defaults
  IF branding IS NULL THEN
    branding := '{
      "use_primary_color": true,
      "use_seo_og_image_as_logo": true,
      "custom_logo_url": null,
      "custom_primary_color": null,
      "font_family": "Arial, Helvetica, sans-serif",
      "button_border_radius": 8,
      "container_max_width": 600
    }'::jsonb;
  END IF;
  
  -- Inject actual values if toggles are true
  IF (branding->>'use_primary_color')::boolean THEN
    branding := jsonb_set(branding, '{primary_color}', to_jsonb(primary_col));
  ELSE
    branding := jsonb_set(branding, '{primary_color}', branding->'custom_primary_color');
  END IF;
  
  IF (branding->>'use_seo_og_image_as_logo')::boolean THEN
    branding := jsonb_set(branding, '{logo_url}', to_jsonb(logo_url));
  ELSE
    branding := jsonb_set(branding, '{logo_url}', branding->'custom_logo_url');
  END IF;
  
  RETURN branding;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update email_threads.message_count
CREATE OR REPLACE FUNCTION update_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.email_threads
    SET 
      message_count = message_count + 1,
      last_message_at = NEW.sent_at,
      updated_at = NOW()
    WHERE id = NEW.thread_id;
    
    -- Set first_message_at if this is the first message
    UPDATE public.email_threads
    SET first_message_at = NEW.sent_at
    WHERE id = NEW.thread_id AND first_message_at IS NULL;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.email_threads
    SET 
      message_count = GREATEST(message_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.thread_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_messages_update_thread_count
AFTER INSERT OR DELETE ON public.email_messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_message_count();

-- Trigger to update email_lists.subscriber_count
CREATE OR REPLACE FUNCTION update_list_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.email_lists
    SET 
      subscriber_count = subscriber_count + 1,
      active_subscriber_count = CASE WHEN NEW.status = 'subscribed' THEN active_subscriber_count + 1 ELSE active_subscriber_count END,
      updated_at = NOW()
    WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.email_lists
    SET 
      subscriber_count = GREATEST(subscriber_count - 1, 0),
      active_subscriber_count = CASE WHEN OLD.status = 'subscribed' THEN GREATEST(active_subscriber_count - 1, 0) ELSE active_subscriber_count END,
      updated_at = NOW()
    WHERE id = OLD.list_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    UPDATE public.email_lists
    SET 
      active_subscriber_count = (
        SELECT COUNT(*) FROM public.email_list_subscribers 
        WHERE list_id = NEW.list_id AND status = 'subscribed'
      ),
      updated_at = NOW()
    WHERE id = NEW.list_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_list_subscribers_update_count
AFTER INSERT OR DELETE OR UPDATE ON public.email_list_subscribers
FOR EACH ROW
EXECUTE FUNCTION update_list_subscriber_count();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER email_threads_updated_at BEFORE UPDATE ON public.email_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER email_messages_updated_at BEFORE UPDATE ON public.email_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER email_lists_updated_at BEFORE UPDATE ON public.email_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER email_list_subscribers_updated_at BEFORE UPDATE ON public.email_list_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 5: Enable Realtime (for inbox notifications)
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.email_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_sent_log;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Run this verification query after migration:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'email_%' 
-- ORDER BY table_name;
--
-- Expected tables: email_accounts, email_attachments, email_campaign_recipients,
-- email_campaigns, email_list_subscribers, email_lists, email_messages, 
-- email_sent_log, email_threads
-- =====================================================
