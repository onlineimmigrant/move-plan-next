// Order system types matching database schema

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type ItemType = 'product' | 'service' | 'subscription';

export interface Order {
  id: string;
  user_id: string;
  organization_id?: string;
  
  // Order metadata
  status: OrderStatus;
  total_amount: number;
  currency: string;
  
  // Payment information
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;
  payment_status: PaymentStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
}

export interface OrderItem {
  id: string;
  order_id: string;
  
  // Product/Service reference
  item_type: ItemType;
  product_id?: number;
  pricingplan_id?: string;
  
  // Service booking reference
  booking_id?: string;
  
  // Item details (snapshot at purchase)
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  
  // Discount/promotion tracking
  discount_amount?: number;
  discount_code?: string;
  
  // Staff assignment (for service bookings)
  selected_staff_id?: string;
  
  // Timestamps
  created_at: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface ServiceCapacity {
  id: string;
  pricingplan_id: string;
  staff_id?: string;
  
  // Time slot
  slot_start: string;
  slot_end: string;
  
  // Capacity tracking
  max_capacity: number;
  current_bookings: number;
  
  // Soft reservation (10-minute hold)
  reserved_until?: string;
  reserved_by?: string;
  
  // Status
  is_available: boolean;
  unavailable_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

// Request/Response types for API
export interface CreateOrderRequest {
  items: {
    item_type: ItemType;
    product_id?: number;
    pricingplan_id?: string;
    booking_id?: string;
    item_name: string;
    item_description?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    discount_code?: string;
    selected_staff_id?: string;
    metadata?: Record<string, any>;
  }[];
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: Order;
  order_items?: OrderItem[];
  error?: string;
}

export interface TimeSlotRequest {
  pricingplan_id: string;
  staff_id?: string;
  start_date: string;
  end_date: string;
}

export interface TimeSlotResponse {
  success: boolean;
  slots?: ServiceCapacity[];
  error?: string;
}

export interface ReserveSlotRequest {
  capacity_id: string;
  duration_minutes?: number;
}

export interface ReserveSlotResponse {
  success: boolean;
  reserved_until?: string;
  error?: string;
}
