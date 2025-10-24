-- ========================================
-- ORDERS SYSTEM MIGRATION
-- Created: 2025-10-22
-- Purpose: Create orders, order_items, and service_capacity tables
-- ========================================

-- NOTE: This migration will DROP existing tables if they exist
-- Make sure to backup any important data before running!

-- Drop existing tables if they exist (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS service_capacity CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- ========================================
-- 1. ORDERS TABLE
-- ========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  
  -- Order metadata
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
  
  -- Payment information
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ========================================
-- 2. ORDER ITEMS TABLE
-- ========================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product/Service reference
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'service', 'subscription')),
  product_id BIGINT REFERENCES product(id),  -- CHANGED: BIGINT to match actual product.id type
  pricingplan_id UUID REFERENCES pricingplan(id),  -- UUID to match actual pricingplan.id type
  
  -- Service booking reference (if item_type = 'service')
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Item details (snapshot at time of purchase)
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Discount/promotion tracking
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code VARCHAR(100),
  
  -- Staff assignment (for service bookings)
  selected_staff_id UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata for additional flexibility
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CHECK (quantity > 0),
  CHECK (unit_price >= 0),
  CHECK (total_price >= 0),
  CHECK (discount_amount >= 0),
  -- At least one product reference must exist
  CHECK (product_id IS NOT NULL OR pricingplan_id IS NOT NULL)
);

-- ========================================
-- 3. SERVICE CAPACITY TABLE
-- ========================================
CREATE TABLE service_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricingplan_id UUID NOT NULL REFERENCES pricingplan(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  
  -- Time slot
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  
  -- Capacity tracking
  max_capacity INTEGER NOT NULL DEFAULT 1,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  
  -- Soft reservation (10-minute hold during checkout)
  reserved_until TIMESTAMPTZ,
  reserved_by UUID REFERENCES profiles(id),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  unavailable_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CHECK (slot_end > slot_start),
  CHECK (max_capacity > 0),
  CHECK (current_bookings >= 0),
  CHECK (current_bookings <= max_capacity)
);

-- ========================================
-- 4. INDEXES FOR PERFORMANCE
-- ========================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_organization_id ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_pricingplan_id ON order_items(pricingplan_id);
CREATE INDEX IF NOT EXISTS idx_order_items_booking_id ON order_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_order_items_staff_id ON order_items(selected_staff_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_type ON order_items(item_type);

-- Service capacity indexes
CREATE INDEX idx_service_capacity_pricingplan_id ON service_capacity(pricingplan_id);
CREATE INDEX idx_service_capacity_staff_id ON service_capacity(staff_id);
CREATE INDEX idx_service_capacity_time_range ON service_capacity(slot_start, slot_end);
CREATE INDEX idx_service_capacity_available ON service_capacity(is_available) WHERE is_available = true;
CREATE INDEX idx_service_capacity_reserved ON service_capacity(reserved_until) WHERE reserved_until IS NOT NULL;
CREATE INDEX idx_service_capacity_slot_start ON service_capacity(slot_start);

-- Add unique constraint for time slot booking (allows NULL staff_id)
CREATE UNIQUE INDEX idx_service_capacity_unique_slot 
  ON service_capacity(pricingplan_id, COALESCE(staff_id, '00000000-0000-0000-0000-000000000000'::uuid), slot_start, slot_end);

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_capacity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own pending orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

DROP POLICY IF EXISTS "Service capacity is viewable by authenticated users" ON service_capacity;
DROP POLICY IF EXISTS "Service providers can manage their capacity" ON service_capacity;
DROP POLICY IF EXISTS "Admins can manage all service capacity" ON service_capacity;

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service capacity policies
CREATE POLICY "Service capacity is viewable by authenticated users"
  ON service_capacity FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service providers can manage their capacity"
  ON service_capacity FOR ALL
  USING (
    auth.uid() = staff_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_service_provider = true
    )
  )
  WITH CHECK (
    auth.uid() = staff_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_service_provider = true
    )
  );

CREATE POLICY "Admins can manage all service capacity"
  ON service_capacity FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 6. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for service_capacity table
DROP TRIGGER IF EXISTS update_service_capacity_updated_at ON service_capacity;
CREATE TRIGGER update_service_capacity_updated_at
  BEFORE UPDATE ON service_capacity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. HELPER FUNCTIONS
-- ========================================

-- Function to check and clean expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE service_capacity
  SET 
    reserved_until = NULL,
    reserved_by = NULL
  WHERE reserved_until < NOW()
    AND reserved_until IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve a time slot
CREATE OR REPLACE FUNCTION reserve_time_slot(
  p_capacity_id UUID,
  p_user_id UUID,
  p_duration_minutes INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  -- Clean up expired reservations first
  PERFORM cleanup_expired_reservations();
  
  -- Check if slot is available
  SELECT (current_bookings < max_capacity AND is_available AND reserved_until IS NULL)
  INTO v_available
  FROM service_capacity
  WHERE id = p_capacity_id;
  
  IF v_available THEN
    -- Reserve the slot
    UPDATE service_capacity
    SET 
      reserved_until = NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
      reserved_by = p_user_id
    WHERE id = p_capacity_id
      AND current_bookings < max_capacity
      AND is_available
      AND reserved_until IS NULL;
    
    RETURN FOUND;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to release a reservation
CREATE OR REPLACE FUNCTION release_reservation(
  p_capacity_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE service_capacity
  SET 
    reserved_until = NULL,
    reserved_by = NULL
  WHERE id = p_capacity_id
    AND reserved_by = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm a booking (increment current_bookings)
CREATE OR REPLACE FUNCTION confirm_booking(
  p_capacity_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify the user has a reservation or the slot is available
  UPDATE service_capacity
  SET 
    current_bookings = current_bookings + 1,
    reserved_until = NULL,
    reserved_by = NULL
  WHERE id = p_capacity_id
    AND (reserved_by = p_user_id OR reserved_until IS NULL)
    AND current_bookings < max_capacity
    AND is_available;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE orders IS 'Main orders table tracking all purchases (products and services)';
COMMENT ON TABLE order_items IS 'Line items for each order, supporting products, pricing plans, and service bookings';
COMMENT ON TABLE service_capacity IS 'Time slot availability and capacity management for service bookings';

COMMENT ON COLUMN orders.status IS 'Order processing status: pending, processing, completed, cancelled, refunded';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: unpaid, paid, failed, refunded';
COMMENT ON COLUMN order_items.item_type IS 'Type of item: product, service, or subscription';
COMMENT ON COLUMN service_capacity.reserved_until IS 'Soft reservation timestamp (10-minute hold during checkout)';
COMMENT ON COLUMN service_capacity.max_capacity IS 'Maximum number of concurrent bookings for this time slot';

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Verify tables were created
DO $$
DECLARE
  v_orders_exists BOOLEAN;
  v_order_items_exists BOOLEAN;
  v_service_capacity_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'orders'
  ) INTO v_orders_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items'
  ) INTO v_order_items_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_capacity'
  ) INTO v_service_capacity_exists;
  
  IF v_orders_exists AND v_order_items_exists AND v_service_capacity_exists THEN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - orders table created';
    RAISE NOTICE '   - order_items table created';
    RAISE NOTICE '   - service_capacity table created';
    RAISE NOTICE '   - All indexes created';
    RAISE NOTICE '   - RLS policies enabled';
    RAISE NOTICE '   - Helper functions created';
  ELSE
    RAISE WARNING '⚠️  Some tables may not have been created. Please verify manually.';
  END IF;
END $$;
