-- ============================================
-- Phase 7: Customer Portal - Knowledge Base Integration
-- ============================================
-- Created: October 18, 2025
-- Purpose: Track KB article interactions and ticket relationships

-- ============================================
-- 1. TICKET KB INTERACTIONS TABLE
-- ============================================
-- Track customer interactions with knowledge base articles
CREATE TABLE IF NOT EXISTS ticket_kb_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Article details
  article_id INTEGER NOT NULL REFERENCES blog_post(id) ON DELETE CASCADE,
  
  -- Interaction type
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'helpful', 'not_helpful', 'solved_issue', 'shared'
  
  -- Context
  search_query TEXT, -- What did user search for to find this article
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL, -- If they created ticket anyway
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session tracking
  session_id VARCHAR(255), -- Track unique browsing session
  referrer_url TEXT, -- Where did they come from
  
  -- Engagement metrics
  time_spent_seconds INTEGER, -- How long did they read
  scroll_percentage INTEGER, -- How far did they scroll (0-100)
  
  -- Resolution tracking
  resolved_without_ticket BOOLEAN DEFAULT false, -- Article solved their issue
  created_ticket_anyway BOOLEAN DEFAULT false, -- Created ticket despite reading
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_interaction_type CHECK (interaction_type IN ('view', 'helpful', 'not_helpful', 'solved_issue', 'shared', 'clicked_link'))
);

-- Indexes for analytics queries
CREATE INDEX idx_kb_interactions_article ON ticket_kb_interactions(article_id, created_at DESC);
CREATE INDEX idx_kb_interactions_org ON ticket_kb_interactions(organization_id, created_at DESC);
CREATE INDEX idx_kb_interactions_type ON ticket_kb_interactions(interaction_type, created_at DESC);
CREATE INDEX idx_kb_interactions_helpful ON ticket_kb_interactions(article_id, interaction_type) WHERE interaction_type IN ('helpful', 'not_helpful');
CREATE INDEX idx_kb_interactions_resolved ON ticket_kb_interactions(article_id) WHERE resolved_without_ticket = true;
CREATE INDEX idx_kb_interactions_customer ON ticket_kb_interactions(customer_id, created_at DESC);

-- ============================================
-- 2. TICKET RATINGS TABLE
-- ============================================
-- Customer satisfaction ratings for resolved tickets
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rating details
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  feedback TEXT, -- Optional written feedback
  
  -- Rating categories (optional detailed feedback)
  response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  
  -- Sentiment analysis (can be auto-generated from feedback)
  sentiment VARCHAR(50), -- 'positive', 'neutral', 'negative'
  
  -- Metadata
  rated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Which admin handled the ticket
  
  -- Public/private
  is_public BOOLEAN DEFAULT false, -- Can be displayed as testimonial
  is_published BOOLEAN DEFAULT false, -- Admin approved for public display
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(ticket_id) -- One rating per ticket
);

CREATE INDEX idx_ticket_ratings_ticket ON ticket_ratings(ticket_id);
CREATE INDEX idx_ticket_ratings_org ON ticket_ratings(organization_id, created_at DESC);
CREATE INDEX idx_ticket_ratings_rating ON ticket_ratings(rating, created_at DESC);
CREATE INDEX idx_ticket_ratings_admin ON ticket_ratings(admin_id, created_at DESC);
CREATE INDEX idx_ticket_ratings_public ON ticket_ratings(organization_id, is_public, is_published) WHERE is_public = true AND is_published = true;

-- ============================================
-- 3. CUSTOMER NOTIFICATION PREFERENCES TABLE
-- ============================================
-- Store customer preferences for ticket notifications
CREATE TABLE IF NOT EXISTS customer_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Email notifications
  email_on_new_response BOOLEAN DEFAULT true,
  email_on_status_change BOOLEAN DEFAULT true,
  email_on_assignment BOOLEAN DEFAULT false,
  email_on_ticket_closed BOOLEAN DEFAULT true,
  
  -- In-app notifications
  inapp_on_new_response BOOLEAN DEFAULT true,
  inapp_on_status_change BOOLEAN DEFAULT true,
  inapp_on_assignment BOOLEAN DEFAULT false,
  
  -- SMS notifications (if implemented)
  sms_enabled BOOLEAN DEFAULT false,
  sms_number VARCHAR(20),
  sms_on_new_response BOOLEAN DEFAULT false,
  sms_on_urgent_only BOOLEAN DEFAULT true,
  
  -- Digest settings
  daily_digest_enabled BOOLEAN DEFAULT false,
  weekly_digest_enabled BOOLEAN DEFAULT false,
  digest_email VARCHAR(255),
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME, -- e.g., '08:00'
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id, organization_id)
);

CREATE INDEX idx_notification_prefs_customer ON customer_notification_preferences(customer_id);
CREATE INDEX idx_notification_prefs_org ON customer_notification_preferences(organization_id);

-- ============================================
-- 4. NOTIFICATION QUEUE TABLE
-- ============================================
-- Queue for pending notifications to be sent
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Recipient
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  
  -- Notification details
  notification_type VARCHAR(100) NOT NULL, -- 'new_response', 'status_change', 'ticket_closed', 'rating_request'
  channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'inapp', 'push'
  
  -- Content
  subject VARCHAR(500),
  message TEXT NOT NULL,
  
  -- Related entities
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Template and variables
  template_name VARCHAR(100),
  template_variables JSONB, -- Variables to inject into template
  
  -- Delivery status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When to send (for quiet hours)
  expires_at TIMESTAMP WITH TIME ZONE, -- Don't send after this time
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_channel CHECK (channel IN ('email', 'sms', 'inapp', 'push')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

CREATE INDEX idx_notification_queue_recipient ON notification_queue(recipient_id, status, scheduled_for);
CREATE INDEX idx_notification_queue_status ON notification_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notification_queue_ticket ON notification_queue(ticket_id, created_at DESC);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE status = 'pending';

-- ============================================
-- 5. ARTICLE SUGGESTION HISTORY TABLE
-- ============================================
-- Track which articles were suggested for which queries/tickets
CREATE TABLE IF NOT EXISTS article_suggestion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Suggestion context
  search_query TEXT NOT NULL,
  suggested_article_ids INTEGER[] NOT NULL, -- Array of blog_post IDs
  
  -- Suggestion quality
  suggestion_score DECIMAL(5,2), -- 0-100 score of relevance
  algorithm_version VARCHAR(50), -- Track which algorithm generated suggestions
  
  -- Outcome
  article_clicked_id INTEGER REFERENCES blog_post(id) ON DELETE SET NULL, -- Which article (if any) was clicked
  click_position INTEGER, -- Position in suggestions list (1-based)
  resolved_issue BOOLEAN, -- Did it resolve the issue
  created_ticket BOOLEAN DEFAULT false, -- Did they create ticket anyway
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  
  -- User context
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_article_suggestions_query ON article_suggestion_history(organization_id, search_query);
CREATE INDEX idx_article_suggestions_clicked ON article_suggestion_history(article_clicked_id) WHERE article_clicked_id IS NOT NULL;
CREATE INDEX idx_article_suggestions_resolved ON article_suggestion_history(organization_id, resolved_issue) WHERE resolved_issue = true;
CREATE INDEX idx_article_suggestions_created_ticket ON article_suggestion_history(organization_id, created_ticket) WHERE created_ticket = true;

-- ============================================
-- 6. CUSTOMER PORTAL SESSIONS TABLE
-- ============================================
-- Track customer portal usage and engagement
CREATE TABLE IF NOT EXISTS customer_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Session details
  session_id VARCHAR(255) NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session metrics
  pages_viewed INTEGER DEFAULT 0,
  articles_read INTEGER DEFAULT 0,
  tickets_created INTEGER DEFAULT 0,
  tickets_viewed INTEGER DEFAULT 0,
  
  -- Engagement score (0-100)
  engagement_score DECIMAL(5,2),
  
  -- Session tracking
  first_page VARCHAR(500),
  last_page VARCHAR(500),
  referrer_url TEXT,
  user_agent TEXT,
  
  -- Outcome
  session_outcome VARCHAR(100), -- 'self_served', 'created_ticket', 'abandoned', 'escalated'
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_outcome CHECK (session_outcome IN ('self_served', 'created_ticket', 'abandoned', 'escalated', 'ongoing'))
);

CREATE INDEX idx_portal_sessions_customer ON customer_portal_sessions(customer_id, started_at DESC);
CREATE INDEX idx_portal_sessions_org ON customer_portal_sessions(organization_id, started_at DESC);
CREATE INDEX idx_portal_sessions_outcome ON customer_portal_sessions(session_outcome, started_at DESC);
CREATE INDEX idx_portal_sessions_active ON customer_portal_sessions(last_activity_at DESC) WHERE ended_at IS NULL;

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

ALTER TABLE ticket_kb_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_suggestion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_sessions ENABLE ROW LEVEL SECURITY;

-- KB Interactions - customers can view their own, admins can view all
CREATE POLICY "Customers can view own KB interactions" ON ticket_kb_interactions
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins can view all KB interactions" ON ticket_kb_interactions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert KB interactions" ON ticket_kb_interactions
  FOR INSERT WITH CHECK (true);

-- Ticket Ratings - customers can rate their tickets, admins can view
CREATE POLICY "Customers can rate own tickets" ON ticket_ratings
  FOR INSERT WITH CHECK (rated_by = auth.uid());

CREATE POLICY "Customers can view own ratings" ON ticket_ratings
  FOR SELECT USING (rated_by = auth.uid());

CREATE POLICY "Admins can view all ratings" ON ticket_ratings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notification Preferences - customers can manage their own
CREATE POLICY "Customers can manage own preferences" ON customer_notification_preferences
  FOR ALL USING (customer_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get article performance metrics
CREATE OR REPLACE FUNCTION get_article_performance(p_article_id INTEGER, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_views BIGINT,
  helpful_votes BIGINT,
  not_helpful_votes BIGINT,
  helpfulness_ratio DECIMAL,
  resolved_issues BIGINT,
  avg_time_spent INTEGER,
  avg_scroll_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE interaction_type = 'view') as total_views,
    COUNT(*) FILTER (WHERE interaction_type = 'helpful') as helpful_votes,
    COUNT(*) FILTER (WHERE interaction_type = 'not_helpful') as not_helpful_votes,
    CASE 
      WHEN COUNT(*) FILTER (WHERE interaction_type IN ('helpful', 'not_helpful')) > 0
      THEN (COUNT(*) FILTER (WHERE interaction_type = 'helpful')::DECIMAL / 
            COUNT(*) FILTER (WHERE interaction_type IN ('helpful', 'not_helpful'))::DECIMAL * 100)
      ELSE 0
    END as helpfulness_ratio,
    COUNT(*) FILTER (WHERE resolved_without_ticket = true) as resolved_issues,
    AVG(time_spent_seconds)::INTEGER as avg_time_spent,
    AVG(scroll_percentage)::DECIMAL as avg_scroll_percentage
  FROM ticket_kb_interactions
  WHERE article_id = p_article_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer satisfaction metrics
CREATE OR REPLACE FUNCTION get_satisfaction_metrics(p_organization_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_ratings BIGINT,
  avg_rating DECIMAL,
  rating_distribution JSONB,
  avg_response_time_rating DECIMAL,
  avg_helpfulness_rating DECIMAL,
  avg_professionalism_rating DECIMAL,
  nps_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_ratings,
    AVG(rating)::DECIMAL as avg_rating,
    jsonb_object_agg(
      rating::TEXT,
      rating_count
    ) as rating_distribution,
    AVG(response_time_rating)::DECIMAL as avg_response_time_rating,
    AVG(helpfulness_rating)::DECIMAL as avg_helpfulness_rating,
    AVG(professionalism_rating)::DECIMAL as avg_professionalism_rating,
    -- NPS: (% promoters (4-5) - % detractors (1-2)) * 100
    (
      (COUNT(*) FILTER (WHERE rating >= 4)::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0) * 100) -
      (COUNT(*) FILTER (WHERE rating <= 2)::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0) * 100)
    ) as nps_score
  FROM ticket_ratings
  CROSS JOIN LATERAL (
    SELECT rating, COUNT(*)::INTEGER as rating_count
    FROM ticket_ratings tr2
    WHERE tr2.organization_id = p_organization_id
      AND tr2.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY rating
  ) counts
  WHERE organization_id = p_organization_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to check quiet hours and determine send time
CREATE OR REPLACE FUNCTION get_next_send_time(p_customer_id UUID, p_default_time TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_prefs RECORD;
  v_current_time TIME;
  v_send_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get customer preferences
  SELECT * INTO v_prefs
  FROM customer_notification_preferences
  WHERE customer_id = p_customer_id;
  
  -- If no preferences or quiet hours disabled, send immediately
  IF NOT FOUND OR NOT v_prefs.quiet_hours_enabled THEN
    RETURN p_default_time;
  END IF;
  
  -- Convert to customer's timezone
  v_current_time := (p_default_time AT TIME ZONE v_prefs.timezone)::TIME;
  
  -- Check if within quiet hours
  IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time < v_prefs.quiet_hours_end THEN
    -- Schedule for end of quiet hours
    v_send_time := (CURRENT_DATE AT TIME ZONE v_prefs.timezone + v_prefs.quiet_hours_end) AT TIME ZONE v_prefs.timezone;
    
    -- If end time is before current time, it's tomorrow
    IF v_send_time < p_default_time THEN
      v_send_time := v_send_time + INTERVAL '1 day';
    END IF;
    
    RETURN v_send_time;
  END IF;
  
  -- Not in quiet hours, send immediately
  RETURN p_default_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON ticket_kb_interactions TO authenticated;
GRANT ALL ON ticket_ratings TO authenticated;
GRANT ALL ON customer_notification_preferences TO authenticated;
GRANT ALL ON notification_queue TO authenticated;
GRANT ALL ON article_suggestion_history TO authenticated;
GRANT ALL ON customer_portal_sessions TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ticket_kb_interactions IS 'Track customer interactions with knowledge base articles to measure effectiveness';
COMMENT ON TABLE ticket_ratings IS 'Customer satisfaction ratings for resolved tickets with optional feedback';
COMMENT ON TABLE customer_notification_preferences IS 'Customer preferences for how and when to receive ticket notifications';
COMMENT ON TABLE notification_queue IS 'Queue for pending notifications (email, SMS, in-app) with delivery tracking';
COMMENT ON TABLE article_suggestion_history IS 'Track which articles were suggested and their effectiveness';
COMMENT ON TABLE customer_portal_sessions IS 'Track customer portal usage patterns and engagement metrics';

COMMENT ON FUNCTION get_article_performance IS 'Get performance metrics for a specific help article';
COMMENT ON FUNCTION get_satisfaction_metrics IS 'Get customer satisfaction metrics and NPS score';
COMMENT ON FUNCTION get_next_send_time IS 'Calculate when to send notification respecting customer quiet hours';
