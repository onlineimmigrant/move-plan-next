-- ============================================
-- Phase 8: Team Collaboration - Database Schema
-- ============================================
-- Created: October 18, 2025
-- Purpose: Enable admin team collaboration, @mentions, presence tracking, conflict prevention

-- ============================================
-- 1. ADMIN MENTIONS TABLE
-- ============================================
-- Track @mentions of admins in ticket notes/responses
CREATE TABLE IF NOT EXISTS admin_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  response_id UUID REFERENCES ticket_responses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Mention details
  mentioned_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context
  mention_text TEXT, -- The actual @mention text (e.g., "@john")
  context_snippet TEXT, -- Surrounding text for preview
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(response_id, mentioned_admin_id) -- One mention per admin per response
);

CREATE INDEX idx_admin_mentions_ticket ON admin_mentions(ticket_id, created_at DESC);
CREATE INDEX idx_admin_mentions_admin ON admin_mentions(mentioned_admin_id, is_read, created_at DESC);
CREATE INDEX idx_admin_mentions_unread ON admin_mentions(mentioned_admin_id) WHERE is_read = false;
CREATE INDEX idx_admin_mentions_org ON admin_mentions(organization_id, created_at DESC);

-- ============================================
-- 2. TEAM DISCUSSIONS TABLE
-- ============================================
-- Private internal discussions on tickets (not visible to customers)
CREATE TABLE IF NOT EXISTS team_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Discussion details
  message TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Thread support
  parent_id UUID REFERENCES team_discussions(id) ON DELETE CASCADE, -- For threaded replies
  thread_position INTEGER DEFAULT 0, -- Position in thread
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_discussions_ticket ON team_discussions(ticket_id, created_at DESC);
CREATE INDEX idx_team_discussions_admin ON team_discussions(admin_id, created_at DESC);
CREATE INDEX idx_team_discussions_thread ON team_discussions(parent_id, thread_position);
CREATE INDEX idx_team_discussions_active ON team_discussions(ticket_id) WHERE is_deleted = false;

-- ============================================
-- 3. TICKET WATCHERS TABLE
-- ============================================
-- Track which admins are watching/following specific tickets
CREATE TABLE IF NOT EXISTS ticket_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification preferences for this ticket
  notify_on_response BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,
  notify_on_assignment_change BOOLEAN DEFAULT true,
  notify_on_mention BOOLEAN DEFAULT true,
  
  -- Auto-watch settings
  is_auto_watch BOOLEAN DEFAULT false, -- Auto-added (e.g., when assigned)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(ticket_id, admin_id)
);

CREATE INDEX idx_ticket_watchers_ticket ON ticket_watchers(ticket_id);
CREATE INDEX idx_ticket_watchers_admin ON ticket_watchers(admin_id, created_at DESC);
CREATE INDEX idx_ticket_watchers_active ON ticket_watchers(ticket_id, notify_on_response) WHERE notify_on_response = true;

-- ============================================
-- 4. TICKET LOCKS TABLE
-- ============================================
-- Prevent concurrent editing by multiple admins
CREATE TABLE IF NOT EXISTS ticket_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Lock holder
  locked_by_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lock details
  lock_reason VARCHAR(100), -- 'editing_response', 'reviewing', 'assigning'
  lock_type VARCHAR(50) DEFAULT 'soft', -- 'soft' (warning), 'hard' (prevent access)
  
  -- Auto-release
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-release after X minutes of inactivity
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(ticket_id) -- Only one lock per ticket
);

CREATE INDEX idx_ticket_locks_admin ON ticket_locks(locked_by_admin_id);
CREATE INDEX idx_ticket_locks_expires ON ticket_locks(ticket_id, expires_at);
-- Note: Removed WHERE expires_at > NOW() because NOW() is not IMMUTABLE
-- Query should filter expired locks in application code or use: WHERE expires_at > CURRENT_TIMESTAMP in queries

-- ============================================
-- 5. ADMIN PRESENCE TABLE
-- ============================================
-- Track which tickets admins are currently viewing
CREATE TABLE IF NOT EXISTS admin_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Presence details
  activity_type VARCHAR(50) DEFAULT 'viewing', -- 'viewing', 'typing', 'idle'
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session tracking
  session_id VARCHAR(255), -- Browser session
  page_url TEXT, -- Current page
  
  -- Auto-expire
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_presence_ticket ON admin_presence(ticket_id, last_active_at DESC);
CREATE INDEX idx_admin_presence_admin ON admin_presence(admin_id, last_active_at DESC);
CREATE INDEX idx_admin_presence_expires ON admin_presence(ticket_id, expires_at);
-- Note: Removed WHERE expires_at > NOW() because NOW() is not IMMUTABLE
-- Query should filter expired presence in application code or use: WHERE expires_at > CURRENT_TIMESTAMP in queries
CREATE INDEX idx_admin_presence_org ON admin_presence(organization_id, last_active_at DESC);

-- ============================================
-- 6. TEAM CHAT CHANNELS TABLE
-- ============================================
-- Chat channels/rooms for different teams or topics
-- NOTE: This table MUST come BEFORE team_chat_messages because team_chat_messages references it
CREATE TABLE IF NOT EXISTS team_chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Channel details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel_type VARCHAR(50) DEFAULT 'team', -- 'team', 'department', 'project', 'announcement'
  
  -- Access control
  is_private BOOLEAN DEFAULT false,
  allowed_admin_ids UUID[], -- If private, only these admins can access
  
  -- Channel settings
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_team_chat_channels_org ON team_chat_channels(organization_id, is_archived);
CREATE INDEX idx_team_chat_channels_active ON team_chat_channels(organization_id) WHERE is_archived = false;

-- ============================================
-- 7. TEAM CHAT MESSAGES TABLE
-- ============================================
-- Real-time chat between admins (not ticket-specific)
CREATE TABLE IF NOT EXISTS team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Message details
  message TEXT NOT NULL,
  sender_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel/Room
  channel_id UUID REFERENCES team_chat_channels(id) ON DELETE CASCADE, -- NULL for direct messages
  recipient_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For DMs
  
  -- Message type
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'system', 'file', 'ticket_link'
  
  -- Rich content
  metadata JSONB, -- Links, ticket references, file info, etc.
  
  -- Thread support
  parent_message_id UUID REFERENCES team_chat_messages(id) ON DELETE CASCADE,
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Read receipts
  read_by_admin_ids UUID[], -- Array of admin UUIDs who read this
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_chat_channel ON team_chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_team_chat_sender ON team_chat_messages(sender_admin_id, created_at DESC);
CREATE INDEX idx_team_chat_recipient ON team_chat_messages(recipient_admin_id, created_at DESC);
CREATE INDEX idx_team_chat_thread ON team_chat_messages(parent_message_id, created_at);
CREATE INDEX idx_team_chat_active ON team_chat_messages(channel_id, created_at DESC) WHERE is_deleted = false;

-- ============================================
-- 8. ACTIVITY FEED TABLE
-- ============================================
-- Track all ticket and team activities for feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(100) NOT NULL, -- 'ticket_created', 'response_added', 'status_changed', 'assigned', 'mentioned', 'comment_added'
  actor_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who did the action
  
  -- Related entities
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  response_id UUID REFERENCES ticket_responses(id) ON DELETE SET NULL,
  discussion_id UUID REFERENCES team_discussions(id) ON DELETE SET NULL,
  
  -- Activity data
  activity_data JSONB, -- Flexible data for different activity types
  -- Example: {"old_status": "open", "new_status": "in-progress", "reason": "Started working"}
  
  -- Display
  summary TEXT, -- Human-readable summary (e.g., "John assigned ticket #123 to Sarah")
  icon VARCHAR(50), -- Icon name for UI
  
  -- Visibility
  is_public BOOLEAN DEFAULT false, -- Visible to customers
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_org ON activity_feed(organization_id, created_at DESC);
CREATE INDEX idx_activity_feed_ticket ON activity_feed(ticket_id, created_at DESC);
CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_admin_id, created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type, created_at DESC);
CREATE INDEX idx_activity_feed_public ON activity_feed(ticket_id, is_public, created_at DESC) WHERE is_public = true;

-- ============================================
-- 9. TICKET HANDOFF NOTES TABLE
-- ============================================
-- Special notes when transferring tickets between admins
CREATE TABLE IF NOT EXISTS ticket_handoff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Handoff details
  from_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Handoff context
  handoff_reason VARCHAR(100), -- 'shift_end', 'expertise_required', 'workload_balance', 'escalation'
  notes TEXT NOT NULL, -- Context, history, action items
  checklist JSONB, -- {"items": ["Check billing history", "Review previous responses"]}
  
  -- Status
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_handoff_notes_ticket ON ticket_handoff_notes(ticket_id, created_at DESC);
CREATE INDEX idx_handoff_notes_from ON ticket_handoff_notes(from_admin_id, created_at DESC);
CREATE INDEX idx_handoff_notes_to ON ticket_handoff_notes(to_admin_id, is_acknowledged, created_at DESC);
CREATE INDEX idx_handoff_notes_unack ON ticket_handoff_notes(to_admin_id) WHERE is_acknowledged = false;

-- ============================================
-- 10. DUPLICATE TICKETS TABLE
-- ============================================
-- Track duplicate ticket relationships and merges
CREATE TABLE IF NOT EXISTS duplicate_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Duplicate relationship
  primary_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE, -- The ticket to keep
  duplicate_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE, -- The duplicate
  
  -- Detection
  similarity_score DECIMAL(5,2), -- 0-100 similarity score
  detection_method VARCHAR(50), -- 'manual', 'auto_text', 'auto_customer', 'auto_email'
  
  -- Merge details
  merge_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'merged', 'rejected'
  merged_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  merged_at TIMESTAMP WITH TIME ZONE,
  merge_notes TEXT,
  
  -- Identified by
  identified_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(primary_ticket_id, duplicate_ticket_id),
  CONSTRAINT different_tickets CHECK (primary_ticket_id != duplicate_ticket_id)
);

CREATE INDEX idx_duplicate_tickets_primary ON duplicate_tickets(primary_ticket_id, merge_status);
CREATE INDEX idx_duplicate_tickets_duplicate ON duplicate_tickets(duplicate_ticket_id);
CREATE INDEX idx_duplicate_tickets_pending ON duplicate_tickets(organization_id, merge_status) WHERE merge_status = 'pending';
CREATE INDEX idx_duplicate_tickets_admin ON duplicate_tickets(identified_by_admin_id, created_at DESC);

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

ALTER TABLE admin_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_handoff_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_tickets ENABLE ROW LEVEL SECURITY;

-- Admins can view all team collaboration data in their organization
CREATE POLICY "Admins can view mentions" ON admin_mentions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage mentions" ON admin_mentions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for all other tables
CREATE POLICY "Admins can view team discussions" ON team_discussions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage team discussions" ON team_discussions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-expire old presence records
CREATE OR REPLACE FUNCTION cleanup_expired_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_presence
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-release expired ticket locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM ticket_locks
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate simple string similarity (Levenshtein-like but simpler)
-- Uses only IMMUTABLE functions: length and position
CREATE OR REPLACE FUNCTION simple_similarity_score(str1 TEXT, str2 TEXT)
RETURNS DECIMAL AS $$
DECLARE
  s1 TEXT;
  s2 TEXT;
  len1 INT;
  len2 INT;
  max_len INT;
  common_words INT := 0;
  total_words INT := 0;
BEGIN
  -- Normalize strings
  s1 := LOWER(TRIM(str1));
  s2 := LOWER(TRIM(str2));
  
  -- If either is null or empty, return 0
  IF s1 IS NULL OR s2 IS NULL OR s1 = '' OR s2 = '' THEN
    RETURN 0.0;
  END IF;
  
  -- If identical, return 1
  IF s1 = s2 THEN
    RETURN 1.0;
  END IF;
  
  -- Simple substring check
  IF s1 LIKE '%' || s2 || '%' OR s2 LIKE '%' || s1 || '%' THEN
    RETURN 0.8;
  END IF;
  
  -- Length-based similarity (simple Jaccard-like)
  len1 := LENGTH(s1);
  len2 := LENGTH(s2);
  max_len := GREATEST(len1, len2);
  
  IF max_len = 0 THEN
    RETURN 0.0;
  END IF;
  
  -- Return inverse of length difference ratio
  RETURN 1.0 - (ABS(len1 - len2)::DECIMAL / max_len::DECIMAL);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to detect duplicate tickets by similarity
-- Uses only IMMUTABLE operations: string comparison, LIKE patterns, and simple_similarity_score
CREATE OR REPLACE FUNCTION detect_duplicate_tickets(
  p_ticket_id UUID,
  p_threshold DECIMAL DEFAULT 70.0
)
RETURNS TABLE(
  potential_duplicate_id UUID,
  similarity_score DECIMAL,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ticket_info AS (
    SELECT 
      t.id,
      COALESCE(t.subject, '') as subject,
      COALESCE(t.message, '') as message,
      t.customer_id,
      COALESCE(t.email, '') as email,
      t.created_at
    FROM tickets t
    WHERE t.id = p_ticket_id
  )
  SELECT 
    t2.id as potential_duplicate_id,
    -- Simplified similarity score using basic string operations
    (
      CASE WHEN t2.customer_id = ti.customer_id THEN 35.0 ELSE 0.0 END +
      CASE WHEN LOWER(t2.email) = LOWER(ti.email) THEN 25.0 ELSE 0.0 END +
      CASE 
        WHEN LOWER(t2.subject) = LOWER(ti.subject) THEN 30.0
        WHEN LOWER(t2.subject) LIKE '%' || LOWER(ti.subject) || '%' THEN 25.0
        WHEN LOWER(ti.subject) LIKE '%' || LOWER(t2.subject) || '%' THEN 25.0
        WHEN simple_similarity_score(t2.subject, ti.subject) > 0.7 THEN 15.0
        ELSE 0.0 
      END +
      CASE 
        WHEN LOWER(t2.message) = LOWER(ti.message) THEN 10.0
        WHEN simple_similarity_score(t2.message, ti.message) > 0.7 THEN 5.0
        ELSE 0.0 
      END
    )::DECIMAL as similarity_score,
    CASE 
      WHEN t2.customer_id = ti.customer_id THEN 'Same customer'
      WHEN LOWER(t2.email) = LOWER(ti.email) THEN 'Same email'
      WHEN LOWER(t2.subject) = LOWER(ti.subject) THEN 'Identical subject'
      WHEN LOWER(t2.subject) LIKE '%' || LOWER(ti.subject) || '%' OR LOWER(ti.subject) LIKE '%' || LOWER(t2.subject) || '%' THEN 'Similar subject'
      ELSE 'Similar content'
    END as reason
  FROM tickets t2, ticket_info ti
  WHERE t2.id != p_ticket_id
    AND t2.organization_id = (SELECT organization_id FROM tickets WHERE id = p_ticket_id)
    AND t2.status != 'closed'
    AND t2.created_at >= ti.created_at - INTERVAL '7 days'
    AND t2.created_at <= ti.created_at + INTERVAL '7 days'
  HAVING (
    CASE WHEN t2.customer_id = ti.customer_id THEN 35.0 ELSE 0.0 END +
    CASE WHEN LOWER(t2.email) = LOWER(ti.email) THEN 25.0 ELSE 0.0 END +
    CASE 
      WHEN LOWER(t2.subject) = LOWER(ti.subject) THEN 30.0
      WHEN LOWER(t2.subject) LIKE '%' || LOWER(ti.subject) || '%' THEN 25.0
      WHEN LOWER(ti.subject) LIKE '%' || LOWER(t2.subject) || '%' THEN 25.0
      WHEN simple_similarity_score(t2.subject, ti.subject) > 0.7 THEN 15.0
      ELSE 0.0 
    END +
    CASE 
      WHEN LOWER(t2.message) = LOWER(ti.message) THEN 10.0
      WHEN simple_similarity_score(t2.message, ti.message) > 0.7 THEN 5.0
      ELSE 0.0 
    END
  ) >= p_threshold
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to get active admins viewing a ticket
CREATE OR REPLACE FUNCTION get_ticket_viewers(p_ticket_id UUID)
RETURNS TABLE(
  admin_id UUID,
  admin_name TEXT,
  activity_type VARCHAR,
  last_active_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.admin_id,
    p.full_name as admin_name,
    ap.activity_type,
    ap.last_active_at
  FROM admin_presence ap
  JOIN profiles p ON ap.admin_id = p.id
  WHERE ap.ticket_id = p_ticket_id
    AND ap.expires_at > NOW()
  ORDER BY ap.last_active_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create activity feed entry
CREATE OR REPLACE FUNCTION log_activity(
  p_organization_id UUID,
  p_activity_type VARCHAR,
  p_actor_admin_id UUID,
  p_ticket_id UUID DEFAULT NULL,
  p_activity_data JSONB DEFAULT '{}',
  p_summary TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activity_feed (
    organization_id,
    activity_type,
    actor_admin_id,
    ticket_id,
    activity_data,
    summary,
    is_public
  ) VALUES (
    p_organization_id,
    p_activity_type,
    p_actor_admin_id,
    p_ticket_id,
    p_activity_data,
    p_summary,
    p_is_public
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create activity feed entries on ticket updates
CREATE OR REPLACE FUNCTION trigger_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity(
      NEW.organization_id,
      'status_changed',
      auth.uid(),
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
      'Ticket status changed from ' || OLD.status || ' to ' || NEW.status,
      true
    );
  END IF;
  
  -- Assignment change
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    PERFORM log_activity(
      NEW.organization_id,
      'ticket_assigned',
      auth.uid(),
      NEW.id,
      jsonb_build_object('old_admin', OLD.assigned_to, 'new_admin', NEW.assigned_to),
      'Ticket reassigned',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tickets table
DROP TRIGGER IF EXISTS ticket_activity_trigger ON tickets;
CREATE TRIGGER ticket_activity_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ticket_activity();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON admin_mentions TO authenticated;
GRANT ALL ON team_discussions TO authenticated;
GRANT ALL ON ticket_watchers TO authenticated;
GRANT ALL ON ticket_locks TO authenticated;
GRANT ALL ON admin_presence TO authenticated;
GRANT ALL ON team_chat_messages TO authenticated;
GRANT ALL ON team_chat_channels TO authenticated;
GRANT ALL ON activity_feed TO authenticated;
GRANT ALL ON ticket_handoff_notes TO authenticated;
GRANT ALL ON duplicate_tickets TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE admin_mentions IS 'Track @mentions of admins in ticket notes for notifications';
COMMENT ON TABLE team_discussions IS 'Private internal discussions on tickets (admin-only)';
COMMENT ON TABLE ticket_watchers IS 'Track which admins are following specific tickets';
COMMENT ON TABLE ticket_locks IS 'Prevent concurrent editing with soft/hard locks';
COMMENT ON TABLE admin_presence IS 'Real-time presence tracking for "currently viewing" indicators';
COMMENT ON TABLE team_chat_messages IS 'Real-time chat between admins for collaboration';
COMMENT ON TABLE team_chat_channels IS 'Chat channels/rooms for teams and departments';
COMMENT ON TABLE activity_feed IS 'Centralized activity log for all ticket and team actions';
COMMENT ON TABLE ticket_handoff_notes IS 'Context and checklists when transferring tickets';
COMMENT ON TABLE duplicate_tickets IS 'Track and merge duplicate ticket submissions';

COMMENT ON FUNCTION cleanup_expired_presence IS 'Auto-remove expired presence records (run via cron)';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Auto-release expired ticket locks (run via cron)';
COMMENT ON FUNCTION detect_duplicate_tickets IS 'Find potential duplicate tickets by similarity score';
COMMENT ON FUNCTION get_ticket_viewers IS 'Get list of admins currently viewing a ticket';
COMMENT ON FUNCTION log_activity IS 'Create activity feed entry for any action';
