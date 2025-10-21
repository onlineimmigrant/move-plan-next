-- Migration: Create Meetings System Tables
-- Purpose: Set up database schema for calendar-meeting module with Twilio video integration
-- Created: 2025-10-20

-- ============================================================================
-- MEETING TYPES TABLE
-- ============================================================================
-- Defines different types of meetings that can be scheduled
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0, -- Buffer time between meetings
  is_active BOOLEAN NOT NULL DEFAULT true,
  color VARCHAR(7), -- Hex color for UI display
  icon VARCHAR(50), -- Icon identifier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AVAILABILITY SCHEDULES TABLE
-- ============================================================================
-- Defines when admins/staff are available for meetings
CREATE TABLE IF NOT EXISTS availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users(id) or profiles(id)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
-- Records scheduled meetings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE SET NULL,
  host_user_id UUID NOT NULL, -- Admin/staff hosting the meeting
  customer_id UUID, -- Customer who booked (can be null for internal meetings)
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_room_id VARCHAR(255), -- Twilio room SID
  meeting_link TEXT, -- Join URL for the meeting
  notes TEXT, -- Internal notes
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_customer_info CHECK (
    (customer_id IS NOT NULL) OR
    (customer_email IS NOT NULL AND customer_name IS NOT NULL)
  )
);

-- ============================================================================
-- MEETING PARTICIPANTS TABLE
-- ============================================================================
-- Tracks who participated in meetings (for reporting and follow-up)
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID, -- If participant is a registered user
  email VARCHAR(255), -- Email for external participants
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'attendee' CHECK (role IN ('host', 'attendee', 'co_host')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Actual time spent in meeting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_participant_info CHECK (
    (user_id IS NOT NULL) OR
    (email IS NOT NULL)
  )
);

-- ============================================================================
-- MEETING ROOMS TABLE
-- ============================================================================
-- Tracks Twilio video rooms and their status
CREATE TABLE IF NOT EXISTS meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  twilio_room_sid VARCHAR(255) UNIQUE NOT NULL,
  twilio_room_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  max_participants INTEGER DEFAULT 2,
  record_participants_on_connect BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Meeting types indexes
CREATE INDEX IF NOT EXISTS idx_meeting_types_organization_id ON meeting_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_types_active ON meeting_types(is_active) WHERE is_active = true;

-- Availability schedules indexes
CREATE INDEX IF NOT EXISTS idx_availability_schedules_org_user ON availability_schedules(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_availability_schedules_day ON availability_schedules(day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_availability_schedules_user_day ON availability_schedules(user_id, day_of_week);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_user ON bookings(host_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_type ON bookings(meeting_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

-- Meeting participants indexes
CREATE INDEX IF NOT EXISTS idx_meeting_participants_booking ON meeting_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_email ON meeting_participants(email);

-- Meeting rooms indexes
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_booking ON meeting_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_twilio_sid ON meeting_rooms(twilio_room_sid);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_status ON meeting_rooms(status);

-- ============================================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Meeting types: Organization members can view, admins can manage
CREATE POLICY "meeting_types_select" ON meeting_types
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "meeting_types_manage" ON meeting_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = meeting_types.organization_id
      AND role IN ('admin', 'owner')
    )
  );

-- Availability schedules: Users can manage their own, admins can view all
CREATE POLICY "availability_schedules_select" ON availability_schedules
  FOR SELECT USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "availability_schedules_manage" ON availability_schedules
  FOR ALL USING (user_id = auth.uid());

-- Bookings: Hosts and organization admins can manage, customers can view their own
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    host_user_id = auth.uid() OR
    customer_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "bookings_manage" ON bookings
  FOR ALL USING (
    host_user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Meeting participants: Related to bookings policy
CREATE POLICY "meeting_participants_select" ON meeting_participants
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE
        host_user_id = auth.uid() OR
        customer_id = auth.uid() OR
        organization_id IN (
          SELECT organization_id FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    )
  );

-- Meeting rooms: Related to bookings policy
CREATE POLICY "meeting_rooms_select" ON meeting_rooms
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE
        host_user_id = auth.uid() OR
        customer_id = auth.uid() OR
        organization_id IN (
          SELECT organization_id FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meeting_types_updated_at
  BEFORE UPDATE ON meeting_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_schedules_updated_at
  BEFORE UPDATE ON availability_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default meeting types
INSERT INTO meeting_types (organization_id, name, description, duration_minutes, buffer_minutes, color, icon)
SELECT
  o.id,
  'Consultation',
  'General consultation meeting',
  30,
  15,
  '#3B82F6',
  'calendar'
FROM organizations o
WHERE o.type = 'general'
AND NOT EXISTS (
  SELECT 1 FROM meeting_types mt WHERE mt.organization_id = o.id AND mt.name = 'Consultation'
);

INSERT INTO meeting_types (organization_id, name, description, duration_minutes, buffer_minutes, color, icon)
SELECT
  o.id,
  'Support Call',
  'Technical support and troubleshooting',
  45,
  15,
  '#10B981',
  'headphones'
FROM organizations o
WHERE o.type = 'general'
AND NOT EXISTS (
  SELECT 1 FROM meeting_types mt WHERE mt.organization_id = o.id AND mt.name = 'Support Call'
);

INSERT INTO meeting_types (organization_id, name, description, duration_minutes, buffer_minutes, color, icon)
SELECT
  o.id,
  'Product Demo',
  'Product demonstration and walkthrough',
  60,
  30,
  '#F59E0B',
  'presentation'
FROM organizations o
WHERE o.type = 'general'
AND NOT EXISTS (
  SELECT 1 FROM meeting_types mt WHERE mt.organization_id = o.id AND mt.name = 'Product Demo'
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE meeting_types IS 'Defines different types of meetings that can be scheduled (consultation, support, demo, etc.)';
COMMENT ON TABLE availability_schedules IS 'Defines when admins/staff are available for meetings by day and time';
COMMENT ON TABLE bookings IS 'Records all scheduled meetings with participant and timing information';
COMMENT ON TABLE meeting_participants IS 'Tracks who participated in meetings for reporting and analytics';
COMMENT ON TABLE meeting_rooms IS 'Tracks Twilio video rooms and their lifecycle status';