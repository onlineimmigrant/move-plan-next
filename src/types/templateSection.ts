/**
 * TypeScript Type Definitions for Template Sections
 * 
 * Strict type definitions for template sections, metrics, and related entities
 * Ensures type safety and better IDE support across the application
 */

/**
 * Gradient configuration for backgrounds
 */
export interface Gradient {
  from: string;
  via?: string;
  to: string;
}

/**
 * Section types supported by the template system
 */
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

/**
 * Text style variants for typography
 */
export type TextStyleVariant = 
  | 'default'
  | 'apple'
  | 'codedharmony'
  | 'magazine'
  | 'startup'
  | 'elegant'
  | 'brutalist'
  | 'modern'
  | 'playful';

/**
 * Translation object - JSONB structure from database
 */
export type TranslationObject = Record<string, string>;

/**
 * Metric/Card item within a section
 */
export interface Metric {
  id: number;
  title: string;
  title_translation?: TranslationObject | null;
  is_title_displayed: boolean;
  description: string;
  description_translation?: TranslationObject | null;
  image?: string | null;
  is_image_rounded_full: boolean;
  is_card_type: boolean;
  background_color?: string | null;
  is_gradient?: boolean;
  gradient?: Gradient | null;
  organization_id: string | null;
}

/**
 * Main template section data structure
 */
export interface TemplateSectionData {
  id: number;
  background_color?: string | null;
  is_gradient?: boolean;
  gradient?: Gradient | null;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  section_title: string;
  section_title_translation?: TranslationObject | null;
  section_description?: string | null;
  section_description_translation?: TranslationObject | null;
  text_style_variant?: TextStyleVariant;
  grid_columns: number;
  image_metrics_height?: string | null;
  is_image_bottom: boolean;
  is_slider?: boolean;
  section_type?: SectionType;
  
  /** @deprecated Use section_type instead */
  is_reviews_section: boolean;
  
  website_metric: Metric[];
  organization_id: string | null;
  form_id?: string | null;
}

/**
 * Props for TemplateSection component
 */
export interface TemplateSectionProps {
  section: TemplateSectionData;
  isPriority?: boolean;
}

/**
 * Translated metric content
 */
export interface TranslatedMetric {
  title: string;
  description: string;
}
