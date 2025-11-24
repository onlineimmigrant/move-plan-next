// /app/types/template_section.ts

export type SectionType = 
  | 'general'
  | 'brand'
  | 'article_slider'
  | 'contact'
  | 'faq'
  | 'reviews'
  | 'help_center'
  | 'real_estate'
  | 'pricing_plans'
  | 'team'
  | 'testimonials'
  | 'appointment'
  | 'form_harmony';

export interface TemplateSection {
  id: string;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  background_color?: string;
  grid_columns?: number;
  is_full_width?: boolean;
  is_section_title_aligned_center?: boolean;
  is_section_title_aligned_right?: boolean;
  is_image_bottom?: boolean;
  is_slider?: boolean;
  
  // New consolidated field
  section_type: SectionType;
  
  // DEPRECATED - Keep for backward compatibility during migration
  is_help_center_section?: boolean;
  is_real_estate_modal?: boolean;
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean;
  is_reviews_section?: boolean;
  
  image_metrics_height?: string;
  order?: number;
  url_page?: string;
  organization_id?: string | null;
  website_metric: any[];
  
  // FormHarmony integration
  form_id?: string | null;
}