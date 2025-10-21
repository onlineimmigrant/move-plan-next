-- Migration: Simplify Admin Scheduling (Remove Redundant Fields)
-- Purpose: Admins always have 24-hour access, only business hours needed for customer bookings
-- Created: 2025-10-20

-- ============================================================================
-- REMOVE REDUNDANT ADMIN FIELDS
-- ============================================================================
-- Admins should always have full 24-hour access by default
-- Only need to define business hours for customer bookings

-- Drop the redundant admin scheduling columns
ALTER TABLE organization_meeting_settings 
DROP COLUMN IF EXISTS admin_24hour_scheduling,
DROP COLUMN IF EXISTS admin_slot_start,
DROP COLUMN IF EXISTS admin_slot_end;

-- ============================================================================
-- UPDATE COMMENTS
-- ============================================================================
COMMENT ON TABLE organization_meeting_settings IS 'Organization-wide meeting configuration. Admins always have 24-hour access, business hours define customer booking windows.';
COMMENT ON COLUMN organization_meeting_settings.business_hours_start IS 'Customer booking window start time (admins can book outside these hours)';
COMMENT ON COLUMN organization_meeting_settings.business_hours_end IS 'Customer booking window end time (admins can book outside these hours)';

-- ============================================================================
-- UPDATE HELPER FUNCTION
-- ============================================================================
-- Update function to always give admins 00:00-23:59, customers get business hours

DROP FUNCTION IF EXISTS get_available_time_slots(UUID, DATE, BOOLEAN);

CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_organization_id UUID,
  p_date DATE,
  p_is_admin BOOLEAN DEFAULT false
)
RETURNS TABLE (
  slot_start TIMESTAMP WITH TIME ZONE,
  slot_end TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN,
  is_business_hours BOOLEAN  -- NEW: Indicates if slot is within customer business hours
) AS $$
DECLARE
  v_settings RECORD;
  v_start_time TIME;
  v_end_time TIME;
  v_slot_duration INTEGER;
  v_current_time TIME;
  v_slot_start_ts TIMESTAMP WITH TIME ZONE;
  v_slot_end_ts TIMESTAMP WITH TIME ZONE;
  v_business_start TIME;
  v_business_end TIME;
  v_is_business_hours BOOLEAN;
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
    v_business_start := '09:00:00'::TIME;
    v_business_end := '17:00:00'::TIME;
  ELSE
    v_slot_duration := v_settings.slot_duration_minutes;
    v_business_start := v_settings.business_hours_start;
    v_business_end := v_settings.business_hours_end;
    
    -- Admins always get full 24-hour access
    IF p_is_admin THEN
      v_start_time := '00:00:00'::TIME;
      v_end_time := '23:59:59'::TIME;
    ELSE
      -- Customers get business hours only
      v_start_time := v_business_start;
      v_end_time := v_business_end;
    END IF;
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
    
    -- Check if slot is within business hours (for visual highlighting)
    v_is_business_hours := (
      v_current_time >= v_business_start AND 
      (v_slot_end_ts::TIME) <= v_business_end
    );
    
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
      ) AS is_available,
      v_is_business_hours;
    
    -- Move to next slot
    v_current_time := v_current_time + (v_slot_duration || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_available_time_slots IS 'Returns available time slots. Admins get 24-hour access with business hours highlighted, customers get business hours only.';
