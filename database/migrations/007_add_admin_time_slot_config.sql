-- Migration: Add Admin Time Slot Configuration
-- Purpose: Allow admins to configure time slot availability (24-hour support)
-- Created: 2025-10-20

-- ============================================================================
-- ORGANIZATION MEETING SETTINGS TABLE
-- ============================================================================
-- Stores organization-wide meeting configuration including time slot settings
CREATE TABLE IF NOT EXISTS organization_meeting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Time Slot Configuration
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes IN (15, 30, 45, 60)),
  
  -- Business Hours (for regular bookings)
  business_hours_start TIME NOT NULL DEFAULT '09:00:00',
  business_hours_end TIME NOT NULL DEFAULT '17:00:00',
  
  -- Admin 24-hour scheduling
  admin_24hour_scheduling BOOLEAN NOT NULL DEFAULT false, -- Allow admins to schedule any time
  admin_slot_start TIME NOT NULL DEFAULT '00:00:00', -- Admin available from (default midnight)
  admin_slot_end TIME NOT NULL DEFAULT '23:59:59', -- Admin available to (default end of day)
  
  -- Days of week availability (JSON array of days 0-6, where 0=Sunday)
  available_days JSONB NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb, -- Mon-Fri by default
  
  -- Booking window settings
  min_booking_notice_hours INTEGER NOT NULL DEFAULT 2, -- Minimum hours in advance
  max_booking_days_ahead INTEGER NOT NULL DEFAULT 90, -- Maximum days in future
  
  -- Buffer settings
  default_buffer_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Timezone
  default_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  
  -- Auto-confirmation
  auto_confirm_bookings BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CUSTOM AVAILABILITY OVERRIDES TABLE
-- ============================================================================
-- Allows admins to set custom availability for specific dates
CREATE TABLE IF NOT EXISTS custom_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID, -- Specific user override (null = organization-wide)
  
  -- Date range
  override_date DATE NOT NULL,
  
  -- Override type
  override_type VARCHAR(20) NOT NULL CHECK (override_type IN ('available', 'unavailable', 'custom')),
  
  -- Custom hours (only used if override_type = 'custom')
  custom_start_time TIME,
  custom_end_time TIME,
  
  -- Notes
  reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_custom_times CHECK (
    (override_type != 'custom') OR 
    (custom_start_time IS NOT NULL AND custom_end_time IS NOT NULL AND custom_start_time < custom_end_time)
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_org_meeting_settings_org_id ON organization_meeting_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_avail_org_date ON custom_availability_overrides(organization_id, override_date);
CREATE INDEX IF NOT EXISTS idx_custom_avail_user_date ON custom_availability_overrides(user_id, override_date) WHERE user_id IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE organization_meeting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_availability_overrides ENABLE ROW LEVEL SECURITY;

-- Organization meeting settings policies
CREATE POLICY "Users can view their organization settings"
  ON organization_meeting_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update organization settings"
  ON organization_meeting_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Custom availability overrides policies
CREATE POLICY "Users can view availability overrides"
  ON custom_availability_overrides FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage availability overrides"
  ON custom_availability_overrides FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get available time slots for a given date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_organization_id UUID,
  p_date DATE,
  p_is_admin BOOLEAN DEFAULT false
)
RETURNS TABLE (
  slot_start TIMESTAMP WITH TIME ZONE,
  slot_end TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN
) AS $$
DECLARE
  v_settings RECORD;
  v_start_time TIME;
  v_end_time TIME;
  v_slot_duration INTEGER;
  v_current_time TIME;
  v_slot_start_ts TIMESTAMP WITH TIME ZONE;
  v_slot_end_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get organization settings
  SELECT * INTO v_settings
  FROM organization_meeting_settings
  WHERE organization_id = p_organization_id;
  
  -- Use defaults if no settings exist
  IF NOT FOUND THEN
    v_start_time := '09:00:00'::TIME;
    v_end_time := '17:00:00'::TIME;
    v_slot_duration := 30;
  ELSE
    -- Use admin hours if admin and 24-hour scheduling enabled
    IF p_is_admin AND v_settings.admin_24hour_scheduling THEN
      v_start_time := v_settings.admin_slot_start;
      v_end_time := v_settings.admin_slot_end;
    ELSE
      v_start_time := v_settings.business_hours_start;
      v_end_time := v_settings.business_hours_end;
    END IF;
    v_slot_duration := v_settings.slot_duration_minutes;
  END IF;
  
  -- Generate time slots
  v_current_time := v_start_time;
  
  WHILE v_current_time < v_end_time LOOP
    v_slot_start_ts := (p_date || ' ' || v_current_time)::TIMESTAMP WITH TIME ZONE;
    v_slot_end_ts := v_slot_start_ts + (v_slot_duration || ' minutes')::INTERVAL;
    
    -- Check if slot end time exceeds end time
    IF (v_slot_end_ts::TIME) > v_end_time THEN
      EXIT;
    END IF;
    
    -- Check if slot is available (not booked)
    RETURN QUERY
    SELECT 
      v_slot_start_ts,
      v_slot_end_ts,
      NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE organization_id = p_organization_id
        AND status NOT IN ('cancelled', 'no_show')
        AND (
          (scheduled_at <= v_slot_start_ts AND scheduled_at + (duration_minutes || ' minutes')::INTERVAL > v_slot_start_ts)
          OR
          (scheduled_at < v_slot_end_ts AND scheduled_at >= v_slot_start_ts)
        )
      ) AS is_available;
    
    -- Move to next slot
    v_current_time := v_current_time + (v_slot_duration || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default settings for existing organizations
INSERT INTO organization_meeting_settings (organization_id)
SELECT id FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM organization_meeting_settings
  WHERE organization_id = organizations.id
)
ON CONFLICT (organization_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE organization_meeting_settings IS 'Organization-wide meeting configuration including time slot settings for 24-hour admin scheduling';
COMMENT ON COLUMN organization_meeting_settings.admin_24hour_scheduling IS 'When true, admins can schedule meetings at any time (24 hours)';
COMMENT ON COLUMN organization_meeting_settings.slot_duration_minutes IS 'Duration of each time slot in minutes (15, 30, 45, or 60)';
COMMENT ON TABLE custom_availability_overrides IS 'Custom availability rules for specific dates (holidays, special hours, etc.)';
COMMENT ON FUNCTION get_available_time_slots IS 'Returns available time slots for a given date, with admin 24-hour support';
