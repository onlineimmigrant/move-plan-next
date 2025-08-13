// Product-related TypeScript interfaces
export interface ProductSubType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  organization_id: number;
}

export interface Product {
  id: number;
  created_at: string;
  updated_at: string;
  
  // Basic product information
  product_name: string;
  product_description?: string;
  price_manual?: number;
  currency_manual?: string;
  currency_manual_symbol?: string;
  price_valid_until?: string;
  
  // Media fields
  links_to_video?: string[];
  links_to_image?: string[];
  image_16_9_1200_675?: string;
  image_1_1_1080_1080?: string;
  image_4_3_800_600?: string;
  image_book_800_1200?: string;
  thumbnail_16_9_1280_1720?: string;
  
  // Product classification
  product_sub_type_id?: number;
  product_sub_type_additional_id?: number;
  product_sub_type?: ProductSubType; // Join data
  
  // Display and organization
  is_displayed: boolean;
  is_in_pricingplan_comparison: boolean;
  slug?: string;
  sku?: string;
  order_number: number;
  background_color: string;
  
  // Author information
  author?: string;
  author_2?: string;
  isbn?: string;
  
  // Connected content
  course_connected_id?: number;
  quiz_id?: number;
  video_player?: string;
  
  // Analytics and SEO
  view_count: number;
  metadescription_for_page?: string;
  
  // Additional data
  details?: Record<string, any>;
  attrs?: Record<string, any>;
  
  // Tax and pricing
  product_tax_code?: string;
  
  // External links
  amazon_books_url?: string;
  compare_link_url?: string;
  
  // Integration
  stripe_product_id?: string;
  
  // Organization relationship
  organization_id: number;
}

export interface ProductFilters {
  is_displayed?: boolean;
  is_in_pricingplan_comparison?: boolean;
  product_sub_type_id?: number;
  organization_id?: number;
  search?: string;
}

export interface PricingComparisonProduct extends Pick<Product, 
  'id' | 'product_name' | 'price_manual' | 'currency_manual' | 'currency_manual_symbol' | 
  'order_number' | 'background_color' | 'slug' | 'organization_id'
> {}
