export interface Font {
  id: number;
  name: string;
  description: string | null;
  default_type: boolean;
  created_at: string;
}

export interface Color {
  id: number;
  name: string;
  hex: string;
  img_color: string | null;
  created_at: string;
}

export interface Size {
  id: number;
  name: string;
  value: number;
  description: string | null;
  created_at: string;
}

export type FooterType = 'default' | 'compact' | 'grid';
export type HeaderType = 'default' | 'transparent' | 'fixed';
export type MenuWidth = 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';

// Shared gradient interface
export interface GradientStyle {
  from: string;
  via?: string;
  to: string;
}

export interface FooterStyle {
  type?: FooterType;
  color?: string;
  color_hover?: string;
  background?: string;
  is_gradient?: boolean;        // 🆕 Gradient support
  gradient?: GradientStyle;      // 🆕 Gradient colors
}

export interface HeaderStyle {
  type?: HeaderType;
  color?: string;
  color_hover?: string;
  background?: string;
  menu_width?: MenuWidth;
  menu_items_are_text?: boolean;
  is_gradient?: boolean;        // 🆕 Gradient support
  gradient?: GradientStyle;      // 🆕 Gradient colors
}

export interface Settings {
  site: string | null | undefined; // Simplified to match usage
  id: number;
  organization_id: string;
  image: string;
  menu_width: string;
  menu_items_are_text: boolean;
  header_style: HeaderStyle | string; // Support both JSONB object and legacy string
  footer_style: FooterStyle | string; // Support both JSONB object and legacy string
  favicon: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  seo_og_image: string | null;
  seo_twitter_card: string | null;
  seo_structured_data: any[] | null; // Use any[] for flexibility; can be typed stricter if needed
  domain: string;
  billing_panel_stripe: string;
  google_tag: string;
  language: string; // New language field
  with_language_switch: boolean; // Field for conditional language switcher display
  supported_locales?: string[] | null; // Dynamic supported locales from database
}