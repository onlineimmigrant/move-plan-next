-- Migration: Add ticket assignment and priority features
-- Run this to add assigned_to and priority fields to tickets table

-- ============================================
-- 1. ADD ASSIGNED_TO FIELD
-- ============================================

-- Add assigned_to column (references admin users)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

-- Add comment
COMMENT ON COLUMN tickets.assigned_to IS 'Admin user assigned to handle this ticket';

-- ============================================
-- 2. ADD PRIORITY FIELD
-- ============================================

-- Add priority column with enum values
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add index for performance (useful for sorting/filtering)
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- Add comment
COMMENT ON COLUMN tickets.priority IS 'Ticket priority level: low, medium, high, urgent';

-- ============================================
-- 3. UPDATE RLS POLICIES (if needed)
-- ============================================

-- No changes needed to RLS policies - existing policies already cover these fields
-- Admins can update assigned_to and priority through the existing "Admins can update tickets" policy

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify fields were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'tickets' 
-- AND column_name IN ('assigned_to', 'priority');
