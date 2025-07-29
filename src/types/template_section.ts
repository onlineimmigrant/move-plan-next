// /app/types/template_section.ts
export interface TemplateSection {
  id: string;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple';
  background_color?: string;
  grid_columns?: number;
  is_full_width?: boolean;
  is_section_title_aligned_center?: boolean;
  is_section_title_aligned_right?: boolean;
  is_image_bottom?: boolean;
  image_metrics_height?: string;
  order?: number;
  url_page?: string;
  organization_id?: string | null;
  website_metric: any[];
}