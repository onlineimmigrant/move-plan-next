export interface Organization {
  id: string;
  name: string;
  base_url: string | null;
  base_url_local: string;
  type: string;
  created_by_email: string;
  // Vercel deployment fields
  vercel_project_id?: string | null;
  vercel_deployment_id?: string | null;
  deployment_status?: 'not_deployed' | 'created' | 'building' | 'ready' | 'error' | 'canceled';
  // Additional fields that might be joined or computed
  created_at?: string;
  user_role?: string;
  user_status?: string;
  settings?: Settings;
  website_hero?: HeroData;
}

// Separate interface for hero data (website_hero table)
export interface HeroData {
  id?: string;
  organization_id?: string;
  name?: string;
  font_family?: string;
  h1_title?: string;
  h1_title_translation?: Record<string, string>;
  is_seo_title?: boolean;
  seo_title?: string;
  p_description?: string;
  p_description_translation?: Record<string, string>;
  h1_text_color?: string;
  h1_text_color_gradient_from?: string;
  h1_text_color_gradient_to?: string;
  h1_text_color_gradient_via?: string;
  is_h1_gradient_text?: boolean;
  h1_text_size?: string;
  h1_text_size_mobile?: string;
  image?: string | null; // hero_image
  title_alignment?: string;
  title_block_width?: string;
  is_bg_gradient?: boolean;
  is_image_full_page?: boolean;
  title_block_columns?: number;
  image_first?: boolean;
  background_color?: string;
  background_color_gradient_from?: string;
  background_color_gradient_to?: string;
  background_color_gradient_via?: string;
  button_main_get_started?: string;
  button_explore?: string;
  animation_element?: string;
  p_description_color?: string;
  p_description_size?: string;
  p_description_size_mobile?: string;
  p_description_weight?: string;
}

export interface Settings {
  // Organization Information (for form convenience, but separated when saving)
  name?: string;
  base_url?: string;
  base_url_local?: string;
  type?: string;
  
  // Basic Information (settings table)
  primary_color?: string;
  secondary_color?: string;
  
  // Layout & Design (settings table)
  header_style?: string;
  footer_style?: string;
  font_family?: string;
  
  // Images (settings table)
  image?: string | null;
  favicon?: string | null;
  
  // Hero fields - NEW JSONB SCHEMA (for form convenience - will be separated to HeroData)
  hero_id?: number | null;
  hero_name?: string;
  hero_title?: string;
  hero_description?: string;
  hero_button?: string;
  hero_image?: string | null;
  hero_animation_element?: string;
  hero_display_order?: number;
  
  // JSONB style fields
  hero_title_style?: Record<string, any>;
  hero_description_style?: Record<string, any>;
  hero_image_style?: Record<string, any>;
  hero_background_style?: Record<string, any>;
  hero_button_style?: Record<string, any>;
  
  // JSONB translation fields
  hero_title_translation?: Record<string, string>;
  hero_description_translation?: Record<string, string>;
  hero_button_translation?: Record<string, string>;
  
  // Legacy hero fields (for backward compatibility with old UI)
  title_alignment?: string;
  title_block_width?: string;
  title_block_columns?: number;
  is_seo_title?: boolean;
  h1_title?: string;
  h1_title_translation?: Record<string, string>;
  h1_text_size?: string;
  h1_text_size_mobile?: string;
  h1_text_color?: string;
  is_h1_gradient_text?: boolean;
  h1_text_color_gradient_from?: string;
  h1_text_color_gradient_to?: string;
  h1_text_color_gradient_via?: string;
  p_description?: string;
  p_description_translation?: Record<string, string>;
  p_description_color?: string;
  p_description_size?: string;
  p_description_size_mobile?: string;
  p_description_weight?: string;
  is_bg_gradient?: boolean;
  background_color?: string;
  background_color_gradient_from?: string;
  background_color_gradient_to?: string;
  background_color_gradient_via?: string;
  is_image_full_page?: boolean;
  image_first?: boolean;
  button_main_get_started?: string;
  button_explore?: string;
  animation_element?: string;
  
  // SEO & Analytics
  google_analytics_id?: string;
  google_tag?: string;
  seo_keywords?: string;
  seo_title?: string;
  seo_description?: string;
  
  // Language & Localization
  language?: string;
  with_language_switch?: boolean;
  
  // Menu & Navigation
  menu_items?: any[]; // MenuItem[] - keeping as any[] to avoid circular imports
  submenu_items?: any[]; // SubMenuItem[] - keeping as any[] to avoid circular imports
  
  // Content Management
  blog_posts?: any[]; // BlogPost[] - keeping as any[] to avoid circular imports
  products?: any[]; // Product[] - keeping as any[] to avoid circular imports
  pricing_plans?: any[]; // PricingPlan[] - keeping as any[] to avoid circular imports
  features?: any[]; // Feature[] - keeping as any[] to avoid circular imports
  faqs?: any[]; // FAQ[] - keeping as any[] to avoid circular imports
  banners?: any[]; // Banner[] - keeping as any[] to avoid circular imports
  cookie_categories?: CookieCategory[]; // Cookie consent management - global categories
  cookie_services?: CookieService[]; // Cookie services management - organization-specific
  cookie_consent_records?: CookieConsentRecord[]; // User consent records - operational data
  
  // Contact Information
  contact_email?: string;
  contact_phone?: string;
  
  // AI Management
  ai_endpoint?: string;
  ai_model?: string;
  ai_chat_enabled?: boolean;
  ai_content_generation?: boolean;
  ai_analytics?: boolean;
  ai_management_url?: string;
  ai_agents?: AIAgent[];
  
  // Legacy fields for compatibility
  id?: string;
  organization_id?: string;
  site?: string;
  domain?: string;
  billing_panel_stripe?: string;
  menu_items_are_text?: boolean;
  seo_og_image?: string;
  seo_twitter_card?: string;
  supported_locales?: string[];
}

export interface UserProfile {
  email: string;
  role: string;
  is_site_creator: boolean;
  organization_id: string | null;
  // Legacy field names for backward compatibility
  current_organization_id?: string | null;
  current_organization_type?: string;
}

export const organizationTypes = [
  { value: 'immigration', label: 'Immigration Services', icon: '🛂' },
  { value: 'solicitor', label: 'Legal Services', icon: '⚖️' },
  { value: 'finance', label: 'Financial Services', icon: '💰' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'job', label: 'Job Services', icon: '💼' },
  { value: 'beauty', label: 'Beauty Services', icon: '💄' },
  { value: 'doctor', label: 'Medical Services', icon: '🏥' },
  { value: 'services', label: 'General Services', icon: '🔧' },
  { value: 'realestate', label: 'Real Estate', icon: '🏘️' },
  { value: 'construction', label: 'Construction Services', icon: '🏗️' },
  { value: 'software', label: 'Software & SaaS', icon: '💻' },
  { value: 'marketing', label: 'Marketing & Advertising', icon: '📢' },
  { value: 'consulting', label: 'Consulting Services', icon: '💼' },
  { value: 'automotive', label: 'Auto Services', icon: '🚗' },
  { value: 'hospitality', label: 'Hotels & Tourism', icon: '🏨' },
  { value: 'retail', label: 'Retail & Online', icon: '🛍️' },
  { value: 'healthcare', label: 'Healthcare Services', icon: '🏥' },
  { value: 'transportation', label: 'Transport & Logistics', icon: '🚚' },
  { value: 'technology', label: 'IT & Tech Services', icon: '🔧' },
  { value: 'general', label: 'General Organization', icon: '🏢' },
  { value: 'platform', label: 'Platform', icon: '🏗️' },
];
// 
// Note: 'platform' and 'general' types are filtered out from OrganizationTypeSelect dropdown
// Only 'platform' organization admins can create child organizations
// 'general' remains for backward compatibility but should be migrated to 'platform'

// AI Management Types
export interface AIAgent {
  id?: number;
  organization_id?: string;
  name: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  system_message: string;
  user_role_to_access: string;
  is_active: boolean;
  icon: string | null;
  role: string;
  task: string;
}

// Cookie Consent Management Types
export interface CookieService {
  id?: number;
  created_at?: string;
  name: string;
  description: string;
  active: boolean;
  category_id?: number;
  processing_company?: string;
  data_processor_cookie_policy_url?: string;
  data_processor_privacy_policy_url?: string;
  data_protection_officer_contact?: string;
  retention_period?: string;
  name_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  organization_id?: string; // empty means belongs to all organizations
}

export interface CookieCategory {
  id?: number;
  name: string;
  description: string;
  name_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  cookie_service: CookieService[];
}

export interface CookieConsentRecord {
  id?: number;
  created_at?: string;
  ip_address?: string;
  consent_given: boolean;
  consent_data?: Record<string, any>;
  user_id?: string | null; // Optional since anonymous users might not have user_id
  organization_id: string; // New required field for direct organization linking
  last_updated?: string;
  language_auto?: string;
}
