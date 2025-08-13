// Pricingplan-related TypeScript interfaces

export interface PricingPlan {
  id: number;
  created_at: string;
  updated_at: string;
  
  // Basic pricing information
  price?: number;
  currency?: string;
  currency_symbol?: string;
  recurring_interval?: 'month' | 'year' | 'week' | 'day' | 'one_time';
  recurring_interval_count?: number;
  
  // Calculated prices
  monthly_price_calculated?: number;
  total_price_calculated?: number;
  
  // Promotion fields
  is_promotion: boolean;
  promotion_percent?: number;
  promotion_price?: number;
  valid_until?: string;
  annual_size_discount?: number; // New field for annual discount percentage
  
  // Integration fields
  stripe_price_id?: string;
  
  // Content and description
  package?: string;
  description?: string;
  measure?: string;
  
  // Digital assets
  epub_file?: string;
  pdf_file?: string;
  digital_asset_access: boolean;
  
  // Timing and activation
  date?: string;
  display_date?: string;
  time_slot_duration?: number; // in minutes
  activation_duration?: number; // in days
  grants_permanent_ownership: boolean;
  
  // Status and ordering
  is_active: boolean;
  order_number: number;
  type?: string;
  slug?: string;
  
  // External links
  amazon_books_url?: string;
  
  // Additional data
  details?: Record<string, any>;
  attrs?: Record<string, any>;
  
  // Relationships
  product_id?: number;
  organization_id: number;
  
  // Join data
  product?: {
    id: number;
    product_name: string;
    slug?: string;
  };
}

export interface PricingPlanFilters {
  product_id?: number;
  organization_id?: number;
  is_active?: boolean;
  recurring_interval?: string;
  is_promotion?: boolean;
}

export interface PricingPlanGrouped {
  monthly: PricingPlan[];
  yearly: PricingPlan[];
  one_time: PricingPlan[];
}

// For the pricing modal display
export interface PricingModalPlan {
  id: number;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  features: string[]; // Keep sample features for now
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  currency_symbol: string;
  slug?: string;
  recurring_interval?: string;
  is_promotion: boolean;
  promotion_percent?: number;
  digital_asset_access: boolean;
}
