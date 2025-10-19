-- ============================================
-- Phase 6: Automation & Workflows - Database Schema
-- ============================================
-- Created: October 18, 2025
-- Purpose: Auto-assignment, escalation, SLA, workflows

-- ============================================
-- 1. ASSIGNMENT RULES TABLE
-- ============================================
-- Stores rules for automatic ticket assignment
CREATE TABLE IF NOT EXISTS ticket_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rule identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL, -- 'round_robin', 'tag_based', 'priority_based', 'workload_balanced', 'custom'
  
  -- Rule conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Example: {"tags": ["billing", "payment"], "priority": ["high", "urgent"], "status": "open"}
  
  -- Rule actions (JSONB for flexibility)
  actions JSONB NOT NULL DEFAULT '{}',
  -- Example: {"assign_to_team": "billing_team", "assign_to_user": "uuid", "add_tags": ["auto-assigned"]}
  
  -- Rule priority (lower number = higher priority)
  priority INTEGER DEFAULT 100,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('round_robin', 'tag_based', 'priority_based', 'workload_balanced', 'custom'))
);

-- Index for quick lookups
CREATE INDEX idx_assignment_rules_org_active ON ticket_assignment_rules(organization_id, is_active);
CREATE INDEX idx_assignment_rules_priority ON ticket_assignment_rules(organization_id, priority) WHERE is_active = true;

-- ============================================
-- 2. ASSIGNMENT STATE TABLE
-- ============================================
-- Tracks round-robin state and assignment history
CREATE TABLE IF NOT EXISTS ticket_assignment_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Round-robin tracking
  last_assigned_admin UUID REFERENCES auth.users(id),
  assignment_count INTEGER DEFAULT 0,
  last_assignment_at TIMESTAMP WITH TIME ZONE,
  
  -- Team-specific state
  team_name VARCHAR(100),
  team_rotation_order JSONB, -- Array of admin UUIDs in rotation order
  current_rotation_index INTEGER DEFAULT 0,
  
  -- Workload balancing
  admin_workloads JSONB DEFAULT '{}', -- {"admin_uuid": ticket_count}
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, team_name)
);

CREATE INDEX idx_assignment_state_org ON ticket_assignment_state(organization_id);

-- ============================================
-- 3. ADMIN TEAMS TABLE
-- ============================================
-- Organize admins into teams for tag-based routing
CREATE TABLE IF NOT EXISTS admin_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Team details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Team configuration
  tags JSONB DEFAULT '[]', -- Tags this team handles: ["billing", "payments", "refunds"]
  is_active BOOLEAN DEFAULT true,
  
  -- Availability
  max_concurrent_tickets INTEGER, -- Max tickets per admin
  working_hours JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_admin_teams_org ON admin_teams(organization_id, is_active);

-- ============================================
-- 4. ADMIN TEAM MEMBERS TABLE
-- ============================================
-- Map admins to teams
CREATE TABLE IF NOT EXISTS admin_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Member details
  role VARCHAR(50) DEFAULT 'member', -- 'lead', 'member', 'backup'
  is_active BOOLEAN DEFAULT true,
  
  -- Availability
  availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'away', 'offline'
  max_concurrent_tickets INTEGER DEFAULT 10,
  current_ticket_count INTEGER DEFAULT 0,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, admin_id),
  CONSTRAINT valid_role CHECK (role IN ('lead', 'member', 'backup')),
  CONSTRAINT valid_availability CHECK (availability_status IN ('available', 'busy', 'away', 'offline'))
);

CREATE INDEX idx_team_members_team ON admin_team_members(team_id, is_active);
CREATE INDEX idx_team_members_admin ON admin_team_members(admin_id);
CREATE INDEX idx_team_members_available ON admin_team_members(team_id, availability_status) WHERE is_active = true;

-- ============================================
-- 5. AUTO RESPONSES TABLE
-- ============================================
-- Predefined automatic responses triggered by events
CREATE TABLE IF NOT EXISTS ticket_auto_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Response details
  name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL, -- 'ticket_created', 'status_changed', 'assigned', 'escalated', 'sla_warning'
  
  -- Conditions for triggering
  conditions JSONB DEFAULT '{}',
  -- Example: {"status": "open", "priority": ["high", "urgent"], "tags": ["billing"]}
  
  -- Response template
  message_template TEXT NOT NULL,
  -- Supports variables: {{customer_name}}, {{ticket_id}}, {{status}}, {{priority}}, {{admin_name}}
  
  -- Response settings
  delay_minutes INTEGER DEFAULT 0, -- Delay before sending (0 = immediate)
  send_to_customer BOOLEAN DEFAULT true,
  add_as_note BOOLEAN DEFAULT false, -- Also add to internal notes
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- If multiple match, use highest priority (lowest number)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_trigger CHECK (trigger_event IN ('ticket_created', 'status_changed', 'assigned', 'escalated', 'sla_warning', 'sla_breach', 'inactive_warning', 'auto_closed'))
);

CREATE INDEX idx_auto_responses_org_trigger ON ticket_auto_responses(organization_id, trigger_event, is_active);
CREATE INDEX idx_auto_responses_priority ON ticket_auto_responses(organization_id, priority) WHERE is_active = true;

-- ============================================
-- 6. SLA POLICIES TABLE
-- ============================================
-- Service Level Agreement targets and rules
CREATE TABLE IF NOT EXISTS ticket_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Policy details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- SLA targets (in minutes)
  first_response_time INTEGER NOT NULL, -- Minutes until first admin response required
  resolution_time INTEGER, -- Minutes until ticket should be resolved
  
  -- Conditions (which tickets this applies to)
  conditions JSONB DEFAULT '{}',
  -- Example: {"priority": ["high", "urgent"], "tags": ["premium_customer"]}
  
  -- Escalation settings
  warning_threshold_percent INTEGER DEFAULT 75, -- Warn at 75% of time elapsed
  escalate_on_breach BOOLEAN DEFAULT true,
  escalate_to_admin UUID REFERENCES auth.users(id), -- Escalate to specific admin
  escalate_to_team UUID REFERENCES admin_teams(id), -- Or escalate to team
  
  -- Business hours (SLA clock only runs during these hours)
  business_hours_only BOOLEAN DEFAULT false,
  working_hours JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}}
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- If multiple SLAs match, use highest priority
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sla_policies_org ON ticket_sla_policies(organization_id, is_active);
CREATE INDEX idx_sla_policies_priority ON ticket_sla_policies(priority) WHERE is_active = true;

-- ============================================
-- 7. TICKET SLA TRACKING TABLE
-- ============================================
-- Track SLA compliance for each ticket
CREATE TABLE IF NOT EXISTS ticket_sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES ticket_sla_policies(id) ON DELETE CASCADE,
  
  -- Time tracking
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- SLA status
  first_response_sla_met BOOLEAN,
  resolution_sla_met BOOLEAN,
  
  -- Breach tracking
  first_response_breached_at TIMESTAMP WITH TIME ZONE,
  resolution_breached_at TIMESTAMP WITH TIME ZONE,
  
  -- Pause/resume (for business hours only policies)
  paused_at TIMESTAMP WITH TIME ZONE,
  total_paused_duration_minutes INTEGER DEFAULT 0,
  
  -- Escalation
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID REFERENCES auth.users(id),
  escalation_reason TEXT,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(ticket_id, policy_id)
);

CREATE INDEX idx_sla_tracking_ticket ON ticket_sla_tracking(ticket_id);
CREATE INDEX idx_sla_tracking_breached ON ticket_sla_tracking(ticket_id) WHERE first_response_sla_met = false OR resolution_sla_met = false;

-- ============================================
-- 8. WORKFLOW TRIGGERS TABLE
-- ============================================
-- Custom automation workflows with conditional logic
CREATE TABLE IF NOT EXISTS ticket_workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Workflow details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_event VARCHAR(100) NOT NULL, -- 'ticket_created', 'status_changed', 'tag_added', 'assigned', 'response_added'
  
  -- Conditions (when to execute)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Example: {"status": "open", "priority": "high", "age_hours": {"gt": 24}}
  
  -- Actions to execute (in order)
  actions JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"type": "change_status", "value": "in progress"},
  --   {"type": "assign_to", "value": "admin_uuid"},
  --   {"type": "add_tags", "value": ["escalated"]},
  --   {"type": "send_notification", "to": "admin_uuid", "message": "Ticket escalated"},
  --   {"type": "webhook", "url": "https://...", "method": "POST"}
  -- ]
  
  -- Execution settings
  execute_once_per_ticket BOOLEAN DEFAULT false, -- Only run once per ticket
  delay_minutes INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  
  -- Statistics
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_workflow_trigger CHECK (trigger_event IN ('ticket_created', 'status_changed', 'priority_changed', 'tag_added', 'tag_removed', 'assigned', 'unassigned', 'response_added', 'note_added', 'attachment_added', 'time_elapsed'))
);

CREATE INDEX idx_workflow_triggers_org_event ON ticket_workflow_triggers(organization_id, trigger_event, is_active);
CREATE INDEX idx_workflow_triggers_priority ON ticket_workflow_triggers(organization_id, priority) WHERE is_active = true;

-- ============================================
-- 9. WORKFLOW EXECUTION LOG TABLE
-- ============================================
-- Track workflow executions for debugging and analytics
CREATE TABLE IF NOT EXISTS ticket_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES ticket_workflow_triggers(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Execution details
  triggered_by VARCHAR(100) NOT NULL, -- Event that triggered it
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Results
  success BOOLEAN NOT NULL,
  actions_executed JSONB, -- Which actions were executed
  error_message TEXT,
  
  -- Timing
  execution_duration_ms INTEGER
);

CREATE INDEX idx_workflow_executions_workflow ON ticket_workflow_executions(workflow_id, executed_at DESC);
CREATE INDEX idx_workflow_executions_ticket ON ticket_workflow_executions(ticket_id, executed_at DESC);
CREATE INDEX idx_workflow_executions_errors ON ticket_workflow_executions(workflow_id) WHERE success = false;

-- ============================================
-- 10. ESCALATION RULES TABLE
-- ============================================
-- Define priority-based escalation logic
CREATE TABLE IF NOT EXISTS ticket_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rule details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Escalation conditions
  priority VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  status_conditions JSONB, -- Which statuses trigger escalation
  age_threshold_hours INTEGER NOT NULL, -- Escalate after X hours without response
  
  -- Escalation action
  escalate_to_admin UUID REFERENCES auth.users(id), -- Specific admin
  escalate_to_team UUID REFERENCES admin_teams(id), -- Or team
  new_priority VARCHAR(50), -- Optionally increase priority
  add_tags JSONB DEFAULT '[]', -- Tags to add on escalation
  
  -- Notification
  notify_customer BOOLEAN DEFAULT false,
  notification_template TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT escalate_target_required CHECK (escalate_to_admin IS NOT NULL OR escalate_to_team IS NOT NULL)
);

CREATE INDEX idx_escalation_rules_org ON ticket_escalation_rules(organization_id, is_active);
CREATE INDEX idx_escalation_rules_priority ON ticket_escalation_rules(organization_id, priority) WHERE is_active = true;

-- ============================================
-- 11. WEBHOOK CONFIGURATIONS TABLE
-- ============================================
-- Store webhook endpoints for external integrations
CREATE TABLE IF NOT EXISTS ticket_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Webhook details
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'POST', -- 'POST', 'PUT', 'PATCH'
  
  -- Events to trigger webhook
  events JSONB NOT NULL DEFAULT '[]', -- ['ticket_created', 'status_changed', 'assigned']
  
  -- Authentication
  auth_type VARCHAR(50), -- 'none', 'basic', 'bearer', 'api_key'
  auth_credentials JSONB, -- Encrypted credentials
  
  -- Headers
  custom_headers JSONB DEFAULT '{}',
  
  -- Retry settings
  retry_on_failure BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Statistics
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_method CHECK (method IN ('POST', 'PUT', 'PATCH')),
  CONSTRAINT valid_auth_type CHECK (auth_type IN ('none', 'basic', 'bearer', 'api_key', 'custom'))
);

CREATE INDEX idx_webhooks_org ON ticket_webhooks(organization_id, is_active);

-- ============================================
-- 12. AUTO-CLOSE CONFIGURATION TABLE
-- ============================================
-- Configure auto-close rules for inactive tickets
CREATE TABLE IF NOT EXISTS ticket_auto_close_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rule details
  name VARCHAR(255) NOT NULL,
  
  -- Conditions
  status_conditions JSONB NOT NULL, -- Which statuses can be auto-closed
  inactive_days INTEGER NOT NULL, -- Days without activity before closing
  
  -- Warning before closing
  send_warning BOOLEAN DEFAULT true,
  warning_days_before INTEGER DEFAULT 2, -- Warn X days before auto-close
  warning_message_template TEXT,
  
  -- Close action
  close_message_template TEXT,
  add_tags_on_close JSONB DEFAULT '[]',
  
  -- Reopen settings
  allow_reopen_days INTEGER DEFAULT 7, -- Customer can reopen within X days
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auto_close_rules_org ON ticket_auto_close_rules(organization_id, is_active);

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ticket_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignment_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_auto_close_rules ENABLE ROW LEVEL SECURITY;

-- Create policies (admins can manage their organization's automation)
CREATE POLICY "Admins can view automation rules" ON ticket_assignment_rules
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage automation rules" ON ticket_assignment_rules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables (apply to all automation tables)
-- ... (repeat for each table with same pattern)

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next admin in round-robin rotation
CREATE OR REPLACE FUNCTION get_next_round_robin_admin(
  p_organization_id UUID,
  p_team_name VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_state RECORD;
  v_admins JSONB;
  v_next_index INTEGER;
  v_admin_id UUID;
BEGIN
  -- Get current state for organization/team
  SELECT * INTO v_state
  FROM ticket_assignment_state
  WHERE organization_id = p_organization_id
    AND (team_name = p_team_name OR (team_name IS NULL AND p_team_name IS NULL))
  FOR UPDATE; -- Lock row for update
  
  -- If no state exists, create it
  IF NOT FOUND THEN
    -- Get available admins for this team
    IF p_team_name IS NOT NULL THEN
      SELECT jsonb_agg(admin_id ORDER BY joined_at) INTO v_admins
      FROM admin_team_members atm
      JOIN admin_teams at ON atm.team_id = at.id
      WHERE at.organization_id = p_organization_id
        AND at.name = p_team_name
        AND atm.is_active = true
        AND atm.availability_status = 'available';
    ELSE
      -- Get all available admins for organization
      SELECT jsonb_agg(id ORDER BY email) INTO v_admins
      FROM profiles
      WHERE organization_id = p_organization_id
        AND role = 'admin';
    END IF;
    
    -- Create initial state
    INSERT INTO ticket_assignment_state (organization_id, team_name, team_rotation_order, current_rotation_index)
    VALUES (p_organization_id, p_team_name, COALESCE(v_admins, '[]'::jsonb), 0)
    RETURNING * INTO v_state;
  END IF;
  
  -- Get rotation order
  v_admins := v_state.team_rotation_order;
  
  -- If no admins available, return NULL
  IF jsonb_array_length(v_admins) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Get next admin in rotation
  v_next_index := v_state.current_rotation_index;
  v_admin_id := (v_admins->v_next_index)::text::uuid;
  
  -- Update state for next time
  v_next_index := (v_next_index + 1) % jsonb_array_length(v_admins);
  
  UPDATE ticket_assignment_state
  SET current_rotation_index = v_next_index,
      last_assigned_admin = v_admin_id,
      assignment_count = assignment_count + 1,
      last_assignment_at = NOW(),
      updated_at = NOW()
  WHERE id = v_state.id;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check SLA status
CREATE OR REPLACE FUNCTION check_ticket_sla_status(p_ticket_id UUID)
RETURNS TABLE(
  policy_name VARCHAR,
  first_response_status VARCHAR,
  resolution_status VARCHAR,
  time_remaining_minutes INTEGER,
  is_breached BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tsp.name,
    CASE 
      WHEN tst.first_response_at IS NOT NULL THEN 'met'
      WHEN tst.first_response_breached_at IS NOT NULL THEN 'breached'
      WHEN EXTRACT(EPOCH FROM (NOW() - tst.started_at))/60 > tsp.first_response_time * 0.75 THEN 'warning'
      ELSE 'on_track'
    END,
    CASE 
      WHEN tst.resolved_at IS NOT NULL THEN 'met'
      WHEN tst.resolution_breached_at IS NOT NULL THEN 'breached'
      WHEN tsp.resolution_time IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - tst.started_at))/60 > tsp.resolution_time * 0.75 THEN 'warning'
      ELSE 'on_track'
    END,
    CASE 
      WHEN tst.first_response_at IS NULL THEN 
        (tsp.first_response_time - EXTRACT(EPOCH FROM (NOW() - tst.started_at))/60)::INTEGER
      WHEN tsp.resolution_time IS NOT NULL AND tst.resolved_at IS NULL THEN
        (tsp.resolution_time - EXTRACT(EPOCH FROM (NOW() - tst.started_at))/60)::INTEGER
      ELSE NULL
    END,
    (tst.first_response_breached_at IS NOT NULL OR tst.resolution_breached_at IS NOT NULL)
  FROM ticket_sla_tracking tst
  JOIN ticket_sla_policies tsp ON tst.policy_id = tsp.id
  WHERE tst.ticket_id = p_ticket_id
    AND tsp.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON ticket_assignment_rules TO authenticated;
GRANT ALL ON ticket_assignment_state TO authenticated;
GRANT ALL ON admin_teams TO authenticated;
GRANT ALL ON admin_team_members TO authenticated;
GRANT ALL ON ticket_auto_responses TO authenticated;
GRANT ALL ON ticket_sla_policies TO authenticated;
GRANT ALL ON ticket_sla_tracking TO authenticated;
GRANT ALL ON ticket_workflow_triggers TO authenticated;
GRANT ALL ON ticket_workflow_executions TO authenticated;
GRANT ALL ON ticket_escalation_rules TO authenticated;
GRANT ALL ON ticket_webhooks TO authenticated;
GRANT ALL ON ticket_auto_close_rules TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ticket_assignment_rules IS 'Automatic ticket assignment rules (round-robin, tag-based, etc.)';
COMMENT ON TABLE ticket_assignment_state IS 'Tracks round-robin state and assignment rotation';
COMMENT ON TABLE admin_teams IS 'Organize admins into teams for specialized support';
COMMENT ON TABLE admin_team_members IS 'Map admins to teams with availability status';
COMMENT ON TABLE ticket_auto_responses IS 'Automatic responses triggered by ticket events';
COMMENT ON TABLE ticket_sla_policies IS 'Service Level Agreement policies and targets';
COMMENT ON TABLE ticket_sla_tracking IS 'Track SLA compliance for individual tickets';
COMMENT ON TABLE ticket_workflow_triggers IS 'Custom automation workflows with conditional logic';
COMMENT ON TABLE ticket_workflow_executions IS 'Log of workflow executions for debugging';
COMMENT ON TABLE ticket_escalation_rules IS 'Priority-based automatic escalation rules';
COMMENT ON TABLE ticket_webhooks IS 'Webhook endpoints for external integrations';
COMMENT ON TABLE ticket_auto_close_rules IS 'Rules for automatically closing inactive tickets';
