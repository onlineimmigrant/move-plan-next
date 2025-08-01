export interface Organization {
  id: string;
  name: string;
  base_url: string | null;
  base_url_local: string;
  type: string;
  created_by_email: string;
  // Additional fields that might be joined or computed
  created_at?: string;
  user_role?: string;
  user_status?: string;
  settings?: Settings;
}

export interface Settings {
  // Organization Information
  name?: string;
  base_url?: string;
  base_url_local?: string;
  type?: string;
  
  // Basic Information
  primary_color?: string;
  secondary_color?: string;
  
  // Layout & Design
  header_style?: string;
  footer_color?: string;
  menu_width?: string;
  font_family?: string;
  
  // Images
  image?: string | null;
  favicon?: string | null;
  hero_image?: string | null;
  
  // SEO & Analytics
  google_analytics_id?: string;
  google_tag?: string;
  seo_keywords?: string;
  seo_title?: string;
  seo_description?: string;
  
  // Language & Localization
  language?: string;
  with_language_switch?: boolean;
  
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
