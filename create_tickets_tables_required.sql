-- Migration: Create tickets and ticket_responses tables
-- Run this FIRST before using the ticket modals

-- ============================================
-- 1. TICKETS TABLE (REQUIRED)
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in progress', 'closed')),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  preferred_contact_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_organization_id ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================
-- 2. TICKET_RESPONSES TABLE (REQUIRED)
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  avatar_id UUID, -- Optional - can be NULL if ticket_avatars table doesn't exist
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket_id ON ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_created_at ON ticket_responses(created_at);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Customers can view their own tickets
CREATE POLICY "Customers can view their own tickets" 
  ON tickets 
  FOR SELECT 
  USING (
    customer_id = auth.uid()
    OR 
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Customers can create tickets
CREATE POLICY "Anyone can create tickets" 
  ON tickets 
  FOR INSERT 
  WITH CHECK (true);

-- Admins can update tickets in their organization
CREATE POLICY "Admins can update tickets" 
  ON tickets 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Enable RLS on ticket_responses
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;

-- Users can view responses for tickets they have access to
CREATE POLICY "Users can view ticket responses" 
  ON ticket_responses 
  FOR SELECT 
  USING (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE customer_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

-- Users can create responses for tickets they have access to
CREATE POLICY "Users can create responses" 
  ON ticket_responses 
  FOR INSERT 
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE customer_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- ============================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE tickets IS 'Main table for customer support tickets';
COMMENT ON COLUMN tickets.status IS 'Ticket status: open, in progress, or closed';
COMMENT ON COLUMN tickets.customer_id IS 'User who created the ticket (can be NULL for anonymous tickets)';
COMMENT ON COLUMN tickets.preferred_contact_method IS 'How the customer prefers to be contacted';

COMMENT ON TABLE ticket_responses IS 'Conversation messages for support tickets';
COMMENT ON COLUMN ticket_responses.is_admin IS 'True if response is from admin/support, false if from customer';
COMMENT ON COLUMN ticket_responses.avatar_id IS 'Optional: references ticket_avatars table for admin identity';

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ticket%';

-- Run this to verify RLS policies:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE 'ticket%';
