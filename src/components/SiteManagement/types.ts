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
  title_alighnement?: string;
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
  footer_color?: string;
  menu_width?: string;
  font_family?: string;
  
  // Images (settings table)
  image?: string | null;
  favicon?: string | null;
  
  // Hero fields (for form convenience - will be separated to HeroData)
  hero_image?: string | null;
  hero_name?: string;
  hero_font_family?: string;
  h1_title?: string;
  h1_title_translation?: Record<string, string>;
  is_seo_title?: boolean;
  p_description?: string;
  p_description_translation?: Record<string, string>;
  h1_text_color?: string;
  h1_text_color_gradient_from?: string;
  h1_text_color_gradient_to?: string;
  h1_text_color_gradient_via?: string;
  is_h1_gradient_text?: boolean;
  h1_text_size?: string;
  h1_text_size_mobile?: string;
  title_alighnement?: string;
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
  features?: any[]; // Feature[] - keeping as any[] to avoid circular imports
  faqs?: any[]; // FAQ[] - keeping as any[] to avoid circular imports
  
  // Contact Information
  contact_email?: string;
  contact_phone?: string;
  
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
  { value: 'education', label: 'Education Services', icon: '🎓' },
  { value: 'job', label: 'Job Services', icon: '💼' },
  { value: 'beauty', label: 'Beauty Services', icon: '💄' },
  { value: 'doctor', label: 'Medical Services', icon: '🏥' },
  { value: 'services', label: 'General Services', icon: '🔧' },
  { value: 'general', label: 'General Organization', icon: '🏢' },
];
